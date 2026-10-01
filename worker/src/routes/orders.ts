import type { Env } from "../env";
import { error, json } from "../lib/http";
import { orderId } from "../lib/ids";
import { packLabel, packMultiplier, totals, unitPrice } from "../lib/pricing";

/**
 * Order intake + read-back.
 *
 * Pricing is computed server-side from the product's D1 `sp`/`cp`, never from
 * the client. The order + its line items + stock decrements are written in one
 * D1 batch so a partial write can't leave a half-placed order.
 */

interface PricedItem {
  product_id: string;
  slug: string;
  name: string;
  grams: number;
  grind: string;
  quantity: number;
  unit_price: number;
  unit_cp: number;
  line_total: number;
}

export async function createOrder(env: Env, request: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return error("invalid_json", 400);
  }

  const customer = (body.customer ?? {}) as Record<string, unknown>;
  const name = String(customer.name ?? "").trim();
  const phone = String(customer.phone ?? "").trim();
  const email = String(customer.email ?? "").trim();
  const line1 = String(customer.line1 ?? "").trim();
  const city = String(customer.city ?? "").trim();
  const state = String(customer.state ?? "").trim();
  const pincode = String(customer.pincode ?? "").trim();
  const deliverySlot = String(body.deliverySlot ?? "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  const fields: Record<string, string> = {};
  if (!name) fields.name = "Name is required.";
  if (phone && !/^[+\d][\d\s-]{7,}$/.test(phone)) fields.phone = "Phone number is not valid.";
  if (!line1) fields.line1 = "Address is required.";
  if (!city) fields.city = "City is required.";
  if (!state) fields.state = "State is required.";
  if (!/^[1-9]\d{5}$/.test(pincode)) fields.pincode = "A valid 6-digit PIN code is required.";
  if (items.length === 0) fields.items = "At least one item is required.";
  if (Object.keys(fields).length > 0) {
    return json({ error: "validation_failed", fields }, 422);
  }

  // Price every line against the DB; reject unknown products outright.
  const priced: PricedItem[] = [];
  let subtotal = 0;
  for (const raw of items) {
    const item = raw as Record<string, unknown>;
    const slug = String(item.slug ?? "");
    const grams = Number(item.grams);
    const grind = String(item.grind ?? "whole");
    const quantity = Number(item.quantity);
    if (!slug || !Number.isFinite(grams) || grams <= 0 || !Number.isInteger(quantity) || quantity < 1) {
      return error("invalid_item", 400);
    }
    const row = await env.DB.prepare(
      "SELECT id, slug, name, sp, cp FROM products WHERE slug = ? AND active = 1"
    )
      .bind(slug)
      .first();
    if (!row) return error(`unknown_product:${slug}`, 400);

    const sp = Number(row.sp ?? 0);
    const cp = Number(row.cp ?? 0);
    const up = unitPrice(sp, grams, grind);
    const lineTotal = up * quantity;
    subtotal += lineTotal;
    priced.push({
      product_id: String(row.id),
      slug,
      name: String(row.name),
      grams,
      grind,
      quantity,
      unit_price: up,
      unit_cp: Math.round(cp * packMultiplier(grams)),
      line_total: lineTotal,
    });
  }

  const { shipping, gst, total } = totals(subtotal);
  const id = orderId();
  const now = Math.floor(Date.now() / 1000);
  const consent = body.consent === true;
  const consentVersion = consent ? "1.0" : null;
  const consentedAt = consent ? now : null;

  const statements = [
    env.DB.prepare(
      `INSERT INTO orders (
        id, customer_name, customer_phone, customer_email, address_line1, address_city,
        address_state, address_pincode, delivery_slot, subtotal, delivery, gst, total,
        status, payment_status, consent_version, consented_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', 'unpaid', ?, ?, ?, ?)`
    ).bind(
      id, name, phone || null, email || null, line1, city, state, pincode,
      deliverySlot || null, subtotal, shipping, gst, total,
      consentVersion, consentedAt, now, now
    ),
  ];

  for (const item of priced) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO order_items (
          id, order_id, product_id, product_name, pack_label, grams, grind,
          quantity, unit_price, unit_cp, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(), id, item.product_id, item.name, packLabel(item.grams),
        item.grams, item.grind, item.quantity, item.unit_price, item.unit_cp, item.line_total
      )
    );
    statements.push(
      env.DB.prepare(
        "UPDATE products SET stock_grams = stock_grams - ?, updated_at = ? WHERE id = ?"
      ).bind(item.grams * item.quantity, now, item.product_id)
    );
  }

  await env.DB.batch(statements);

  return json(
    {
      order: {
        id,
        placedAt: new Date(now * 1000).toISOString(),
        status: "new",
        paymentStatus: "unpaid",
        subtotal,
        delivery: shipping,
        gst,
        total,
        deliverySlot: deliverySlot || null,
        customer: { name, phone: phone || null, line1, city, state, pincode },
        items: priced.map((i) => ({
          slug: i.slug,
          name: i.name,
          packLabel: packLabel(i.grams),
          grams: i.grams,
          grind: i.grind,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          lineTotal: i.line_total,
        })),
      },
    },
    201
  );
}

export async function getOrder(env: Env, id: string): Promise<Response> {
  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  if (!order) return error("order_not_found", 404);

  const { results: items } = await env.DB.prepare(
    "SELECT product_id, product_name, pack_label, grams, grind, quantity, unit_price, line_total FROM order_items WHERE order_id = ?"
  )
    .bind(id)
    .all();

  return json({
    order: {
      id: order.id,
      placedAt: new Date(Number(order.created_at) * 1000).toISOString(),
      status: order.status,
      paymentStatus: order.payment_status,
      subtotal: order.subtotal,
      delivery: order.delivery,
      gst: order.gst,
      total: order.total,
      deliverySlot: order.delivery_slot,
      customer: {
        name: order.customer_name,
        phone: order.customer_phone,
        line1: order.address_line1,
        city: order.address_city,
        state: order.address_state,
        pincode: order.address_pincode,
      },
      items: items.map((i) => ({
        slug: i.product_id,
        name: i.product_name,
        packLabel: i.pack_label,
        grams: i.grams,
        grind: i.grind,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        lineTotal: i.line_total,
      })),
    },
  });
}
