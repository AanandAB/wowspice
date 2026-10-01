import type { Env } from "../env";
import { json } from "./http";

/**
 * Admin auth: HS256 JWT sessions + constant-time credential comparison.
 *
 * Single-admin model. The credential lives in a Cloudflare secret (encrypted at
 * rest), never in code or the database, and is compared with a SHA-256 digest
 * XOR to avoid timing and length leaks. A future multi-admin system should hash
 * per-user passwords (argon2/bcrypt) into the `admin_users` table instead.
 */

const encoder = new TextEncoder();

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signJwt(
  secret: string,
  payload: Record<string, unknown>,
  ttlSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlEncode(encoder.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64urlEncode(
    encoder.encode(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds }))
  );
  const key = await hmacKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(`${header}.${body}`))
  );
  return `${header}.${body}.${b64urlEncode(sig)}`;
}

export async function verifyJwt(
  secret: string,
  token: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlDecode(sig),
    encoder.encode(`${header}.${body}`)
  );
  if (!valid) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as Record<
      string,
      unknown
    >;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time comparison via equal-length SHA-256 digests. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const da = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(a)));
  const db = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(b)));
  let diff = 0;
  for (let i = 0; i < da.length; i++) diff |= da[i] ^ db[i];
  return diff === 0;
}

export type AdminAuth = { ok: true; email: string } | { ok: false; response: Response };

/** Extracts and verifies a Bearer JWT, or returns a 401 Response. */
export async function requireAdmin(request: Request, env: Env): Promise<AdminAuth> {
  const header = request.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return { ok: false, response: json({ error: "unauthorized" }, 401) };
  const payload = await verifyJwt(env.JWT_SECRET, match[1]);
  if (!payload || typeof payload.sub !== "string") {
    return { ok: false, response: json({ error: "unauthorized" }, 401) };
  }
  return { ok: true, email: payload.sub };
}
