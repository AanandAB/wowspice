/**
 * Readable, unique-enough order reference: WS-YYYYMMDD-<4 hex>.
 * Uses crypto.getRandomValues (never Math.random) for unpredictability.
 */
export function orderId(now: Date = new Date()): string {
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const buf = new Uint8Array(2);
  crypto.getRandomValues(buf);
  const hex = Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `WS-${stamp}-${hex}`;
}
