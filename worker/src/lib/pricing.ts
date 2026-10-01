/**
 * Pricing maths, mirrored server-side so the backend never trusts a client
 * price (OWASP A01). Keep in sync with the storefront's lib/commerce.ts.
 */

export const GST_RATE = 0.05;
export const FREE_SHIPPING_THRESHOLD = 499;
export const FLAT_SHIPPING = 49;

/** Pack size (grams) -> price multiplier, matching the storefront PACKS. */
const PACK_MULTIPLIERS: Record<number, number> = {
  100: 1,
  250: 2.35,
  500: 4.4,
  1000: 8.3,
};

/** Grind id -> fractional surcharge, matching the storefront GRINDS. */
const GRIND_SURCHARGE: Record<string, number> = { whole: 0, ground: 0.06 };

export function packMultiplier(grams: number): number {
  return PACK_MULTIPLIERS[grams] ?? 1;
}

export function grindSurcharge(grind: string): number {
  return GRIND_SURCHARGE[grind] ?? 0;
}

export function packLabel(grams: number): string {
  return grams >= 1000 ? "1 kg" : `${grams} g`;
}

/** Price for one pack, rounded once, all-in. */
export function unitPrice(sp: number, grams: number, grind: string): number {
  return Math.round(sp * packMultiplier(grams) * (1 + grindSurcharge(grind)));
}

/** Shipping + GST + total for a subtotal. */
export function totals(subtotal: number): {
  shipping: number;
  gst: number;
  total: number;
} {
  const shipping = subtotal <= 0 ? 0 : subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const gst = Math.round(subtotal * GST_RATE);
  return { shipping, gst, total: subtotal + shipping + gst };
}
