import type { Env } from "../env";
import { json } from "../lib/http";
import { requireAdmin } from "../lib/auth";

/**
 * Pricing engine + "other expenses".
 *
 * Minimum SP model (documented so it can be tuned):
 *   expense_per_100g = total_expenses / total_stock_100g_units
 *   min_sp = round((cp + expense_per_100g) * (1 + margin_pct/100))
 * If there is no stock on hand, the expense share is 0 and min_sp is simply
 * CP + margin. `margin_pct` lives in the settings table (default 10).
 */

const DEFAULT_MARGIN_PCT = 10;

async function marginPct(env: Env): Promise<number> {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'margin_pct'").first();
  const n = row ? Number(row.value) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_MARGIN_PCT;
}

export async function adminPricing(env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const margin = await marginPct(env);

  const expRow = await env.DB.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM expenses").first();
  const totalExpenses = Number(expRow?.total ?? 0);

  const stockRow = await env.DB.prepare(
    "SELECT COALESCE(SUM(stock_grams), 0) AS total FROM products WHERE active = 1"
  ).first();
  const stock100g = Number(stockRow?.total ?? 0) / 100;
  const expensePer100g = stock100g > 0 ? totalExpenses / stock100g : 0;

  const { results } = await env.DB.prepare(
    "SELECT id, slug, name, cp, sp, sp_mode, stock_grams, image_url FROM products WHERE active = 1 ORDER BY name"
  ).all();

  const products = results.map((p) => {
    const cp = Number(p.cp ?? 0);
    const sp = Number(p.sp ?? 0);
    const minSp = Math.round((cp + expensePer100g) * (1 + margin / 100));
    return { ...p, min_sp: minSp, below_min: sp < minSp };
  });

  return json({
    margin_pct: margin,
    total_expenses: Math.round(totalExpenses),
    expense_per_100g: Math.round(expensePer100g * 100) / 100,
    products,
  });
}

export async function listExpenses(env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const { results } = await env.DB.prepare(
    "SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC LIMIT 200"
  ).all();
  return json({ expenses: results });
}

export async function createExpense(env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  let body: { category?: string; amount?: number; note?: string; expense_date?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const category = (body.category ?? "").trim();
  const amount = Number(body.amount);
  if (!category) return json({ error: "category_required" }, 400);
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: "invalid_amount" }, 400);

  const note = (body.note ?? "").trim() || null;
  const now = Math.floor(Date.now() / 1000);
  const expenseDate = Number.isFinite(Number(body.expense_date)) ? Math.floor(Number(body.expense_date)) : now;
  const id = crypto.randomUUID();

  await env.DB.prepare(
    "INSERT INTO expenses (id, category, amount, note, expense_date, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  )
    .bind(id, category, amount, note, expenseDate, now)
    .run();

  return json({ ok: true, id }, 201);
}

export async function deleteExpense(env: Env, request: Request, id: string): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  const result = await env.DB.prepare("DELETE FROM expenses WHERE id = ?").bind(id).run();
  if (!result.meta.changes) return json({ error: "expense_not_found" }, 404);

  return json({ ok: true });
}
