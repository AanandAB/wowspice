import type { Env } from "../env";
import { json } from "../lib/http";

/**
 * GET /api/products — public catalogue for the storefront.
 *
 * Phase 1 returns the raw D1 rows to prove the read path works end-to-end.
 * A later phase normalizes bool/JSON columns (D1 returns 0/1 and TEXT) before
 * the storefront consumes them.
 */
export async function listProducts(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT id, slug, name, sp, cp, stock_grams, sp_mode, image_url FROM products WHERE active = 1 ORDER BY name"
  ).all();
  return json({ products: results });
}
