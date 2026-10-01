import type { Env } from "./env";
import { corsHeaders, error, json } from "./lib/http";
import { listProducts } from "./routes/products";

/**
 * wowspice-api — backend for the wowspice storefront + admin CMS.
 *
 * Phase 1 exposes a health check and the public product list so the D1 read
 * path is verifiable against the live Worker. Order write, admin auth and the
 * reporting endpoints land in later phases.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (url.pathname === "/health") {
        return json({ ok: true, service: "wowspice-api", time: new Date().toISOString() });
      }
      if (url.pathname === "/api/products" && method === "GET") {
        return await listProducts(env);
      }
      return error("not_found", 404);
    } catch (err) {
      // A10: never leak internals to the client; log server-side only.
      console.error("unhandled", err);
      return error("internal_error", 500);
    }
  },
};
