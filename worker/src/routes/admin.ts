import type { Env } from "../env";
import { json } from "../lib/http";
import { requireAdmin, safeEqual, signJwt } from "../lib/auth";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Admin auth + protected order list.
 *
 * `POST /api/admin/login` verifies the single admin credential and returns a
 * JWT. `GET /api/admin/orders` lists recent orders (with items) for the CMS.
 */

export async function adminLogin(env: Env, request: Request): Promise<Response> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.JWT_SECRET) {
    return json({ error: "admin_not_configured" }, 503);
  }

  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const emailOk = await safeEqual(email, env.ADMIN_EMAIL.toLowerCase());
  const pwOk = await safeEqual(password, env.ADMIN_PASSWORD);
  if (!emailOk || !pwOk) {
    return json({ error: "invalid_credentials" }, 401);
  }

  const token = await signJwt(env.JWT_SECRET, { sub: env.ADMIN_EMAIL.toLowerCase() }, SESSION_TTL_SECONDS);
  return json({ token });
}

export async function adminOrders(env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const { results: orders } = await env.DB.prepare(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT 50"
  ).all();

  if (orders.length === 0) return json({ orders: [] });

  const ids = orders.map((o) => o.id as string);
  const placeholders = ids.map(() => "?").join(",");
  const { results: items } = await env.DB.prepare(
    `SELECT * FROM order_items WHERE order_id IN (${placeholders})`
  )
    .bind(...ids)
    .all();

  const byOrder = new Map<string, unknown[]>();
  for (const item of items) {
    const key = String(item.order_id);
    const list = byOrder.get(key) ?? [];
    list.push(item);
    byOrder.set(key, list);
  }

  return json({
    orders: orders.map((o) => ({ ...o, items: byOrder.get(String(o.id)) ?? [] })),
  });
}
