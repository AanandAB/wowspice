/**
 * Cloudflare bindings available to the Worker.
 *
 * `IMAGES` and `JWT_SECRET` are optional for phase 1 (R2 may not be enabled on
 * the account yet, and auth lands in a later phase).
 */
export interface Env {
  DB: D1Database;
  IMAGES?: R2Bucket;
  JWT_SECRET?: string;
}
