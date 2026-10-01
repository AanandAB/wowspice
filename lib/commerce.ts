import { GRINDS, PACKS, type GrindOption, type PackSize, type Spice } from "@/data/spices";
import type { SpecimenId } from "@/lib/three/recipes";

/**
 * Cart and pricing maths.
 *
 * Deliberately pure and free of React so it can be unit-tested and, later,
 * lifted onto a server without rewrites.
 */

/**
 * PLACEHOLDER — confirm before taking real money.
 *
 * GST treatment of packaged whole spices varies by whether they are branded,
 * pre-packed and sold by weight, and it is not a rate to guess at. Left as a
 * single configurable constant with the invoice line clearly labelled.
 */
export const GST_RATE = 0.05;

export const FREE_SHIPPING_THRESHOLD = 499;
export const FLAT_SHIPPING = 49;

export interface CartLine {
  /** Stable key: same spice, pack and grind collapse into one line. */
  key: string;
  spiceId: SpecimenId;
  slug: string;
  name: string;
  packLabel: string;
  grams: number;
  grindId: GrindOption["id"];
  grindLabel: string;
  /** Unit price in INR for this pack + grind, all-in, rounded once. */
  unitPrice: number;
  quantity: number;
  accent: string;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  shipping: number;
  shippingIsFree: boolean;
  /** How much more the customer needs to spend to unlock free shipping. */
  freeShippingRemaining: number;
  gst: number;
  total: number;
}

export function packByIndex(index: number): PackSize {
  return PACKS[Math.min(Math.max(index, 0), PACKS.length - 1)];
}

export function grindById(id: GrindOption["id"]): GrindOption {
  return GRINDS.find((g) => g.id === id) ?? GRINDS[0];
}

/**
 * Price for one pack. Rounded once, at the end, so a 250 g pack is never
 * displayed as ₹422.99 while the cart thinks it is ₹423.
 */
export function unitPrice(spice: Spice, pack: PackSize, grind: GrindOption): number {
  return Math.round(spice.basePrice * pack.multiplier * (1 + grind.surcharge));
}

/** Effective price per 100 g, for the "cheaper per gram" comparison. */
export function pricePer100g(spice: Spice, pack: PackSize, grind: GrindOption): number {
  return (unitPrice(spice, pack, grind) / pack.grams) * 100;
}

export function lineKey(
  spiceId: SpecimenId,
  packLabel: string,
  grindId: GrindOption["id"]
): string {
  return `${spiceId}:${packLabel}:${grindId}`;
}

export function makeLine(
  spice: Spice,
  pack: PackSize,
  grind: GrindOption,
  quantity: number
): CartLine {
  return {
    key: lineKey(spice.id, pack.label, grind.id),
    spiceId: spice.id,
    slug: spice.slug,
    name: spice.name,
    packLabel: pack.label,
    grams: pack.grams,
    grindId: grind.id,
    grindLabel: grind.label,
    unitPrice: unitPrice(spice, pack, grind),
    quantity,
    accent: spice.palette.accent,
  };
}

export function cartItemCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
}

export function freeShippingRemaining(subtotal: number): number {
  return Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
}

export function cartTotals(lines: CartLine[]): CartTotals {
  const subtotal = cartSubtotal(lines);
  const shipping = shippingFor(subtotal);
  const gst = Math.round(subtotal * GST_RATE);
  return {
    itemCount: cartItemCount(lines),
    subtotal,
    shipping,
    shippingIsFree: subtotal > 0 && shipping === 0,
    freeShippingRemaining: freeShippingRemaining(subtotal),
    gst,
    total: subtotal + shipping + gst,
  };
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Human-readable grams: 1 kg rather than 1000 g. */
export function formatGrams(grams: number): string {
  return grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`;
}

export interface OrderRecord {
  id: string;
  placedAt: string;
  lines: CartLine[];
  totals: CartTotals;
  address: {
    name: string;
    phone: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  deliverySlot: string;
}

/**
 * Demo order numbers. Date-derived and readable, and prefixed so nobody
 * mistakes a preview order for a real one.
 */
export function makeOrderId(now: Date = new Date()): string {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `WS-DEMO-${stamp}-${random}`;
}
