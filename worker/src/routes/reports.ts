import type { Env } from "../env";
import { json } from "../lib/http";
import { requireAdmin } from "../lib/auth";

/**
 * P&L report. Simplified but transparent:
 *   revenue   = SUM(orders.total)  (excludes cancelled)
 *   cogs      = SUM(order_items.unit_cp * quantity)
 *   gross     = revenue - cogs
 *   net       = gross - SUM(expenses.amount)
 */

export async function adminReports(env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const ordersRow = await env.DB.prepare(
    `SELECT COUNT(*) AS c,
            COALESCE(SUM(total), 0) AS revenue,
            COALESCE(SUM(subtotal), 0) AS subtotal,
            COALESCE(SUM(delivery), 0) AS delivery,
            COALESCE(SUM(gst), 0) AS gst
     FROM orders WHERE status != 'cancelled'`
  ).first();

  const itemsRow = await env.DB.prepare(
    "SELECT COALESCE(SUM(unit_cp * quantity), 0) AS cogs, COALESCE(SUM(quantity), 0) AS units FROM order_items"
  ).first();

  const expRow = await env.DB.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses").first();

  const { results: perProduct } = await env.DB.prepare(
    `SELECT product_id, product_name,
            COALESCE(SUM(quantity), 0) AS units,
            COALESCE(SUM(line_total), 0) AS revenue,
            COALESCE(SUM(unit_cp * quantity), 0) AS cogs
     FROM order_items GROUP BY product_id, product_name ORDER BY revenue DESC`
  ).all();

  const revenue = Number(ordersRow?.revenue ?? 0);
  const cogs = Number(itemsRow?.cogs ?? 0);
  const expenses = Number(expRow?.total ?? 0);
  const gross = revenue - cogs;
  const net = gross - expenses;

  return json({
    orders_count: Number(ordersRow?.c ?? 0),
    units_sold: Number(itemsRow?.units ?? 0),
    subtotal: Math.round(Number(ordersRow?.subtotal ?? 0)),
    delivery: Math.round(Number(ordersRow?.delivery ?? 0)),
    gst: Math.round(Number(ordersRow?.gst ?? 0)),
    revenue: Math.round(revenue),
    cogs: Math.round(cogs),
    gross_profit: Math.round(gross),
    expenses: Math.round(expenses),
    net_profit: Math.round(net),
    per_product: perProduct.map((p) => ({
      slug: p.product_id,
      name: p.product_name,
      units: Number(p.units),
      revenue: Math.round(Number(p.revenue)),
      cogs: Math.round(Number(p.cogs)),
      profit: Math.round(Number(p.revenue) - Number(p.cogs)),
    })),
  });
}
