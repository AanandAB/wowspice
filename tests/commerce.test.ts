import { describe, expect, it } from "vitest";
import { GRINDS, PACKS, SPICES } from "@/data/spices";
import {
  FREE_SHIPPING_THRESHOLD,
  FLAT_SHIPPING,
  GST_RATE,
  cartItemCount,
  cartSubtotal,
  cartTotals,
  lineKey,
  makeLine,
  makeOrderId,
  packByIndex,
  pricePer100g,
  shippingFor,
  unitPrice,
} from "@/lib/commerce";

const pepper = SPICES.find((s) => s.id === "pepper")!;
const turmeric = SPICES.find((s) => s.id === "turmeric")!;
const whole = GRINDS[0];
const ground = GRINDS[1];

describe("unitPrice", () => {
  it("returns the base price for the 100 g whole pack", () => {
    expect(unitPrice(pepper, PACKS[0], whole)).toBe(pepper.basePrice);
  });

  it("rounds to a whole rupee", () => {
    for (const spice of SPICES) {
      for (const pack of PACKS) {
        const price = unitPrice(spice, pack, whole);
        expect(Number.isInteger(price)).toBe(true);
      }
    }
  });

  it("charges more for grinding to order", () => {
    expect(unitPrice(turmeric, PACKS[1], ground)).toBeGreaterThan(
      unitPrice(turmeric, PACKS[1], whole)
    );
  });
});

describe("pack ladder", () => {
  it("gets cheaper per 100 g as the pack grows, for every spice", () => {
    for (const spice of SPICES) {
      const rates = PACKS.map((pack) => pricePer100g(spice, pack, whole));
      for (let i = 1; i < rates.length; i++) {
        expect(rates[i]).toBeLessThanOrEqual(rates[i - 1] + 0.001);
      }
    }
  });

  it("prices larger packs absolutely higher than smaller ones", () => {
    for (const spice of SPICES) {
      for (let i = 1; i < PACKS.length; i++) {
        expect(unitPrice(spice, PACKS[i], whole)).toBeGreaterThan(
          unitPrice(spice, PACKS[i - 1], whole)
        );
      }
    }
  });

  it("clamps out-of-range pack lookups instead of returning undefined", () => {
    expect(packByIndex(-5)).toBe(PACKS[0]);
    expect(packByIndex(99)).toBe(PACKS[PACKS.length - 1]);
  });
});

describe("line keys", () => {
  it("collapses the same spice, pack and grind onto one line", () => {
    expect(lineKey("pepper", "250 g", "whole")).toBe(lineKey("pepper", "250 g", "whole"));
  });

  it("separates lines that differ by pack or grind", () => {
    expect(lineKey("pepper", "250 g", "whole")).not.toBe(lineKey("pepper", "500 g", "whole"));
    expect(lineKey("pepper", "250 g", "whole")).not.toBe(lineKey("pepper", "250 g", "ground"));
  });
});

describe("cart totals", () => {
  const line = (overrides: Partial<ReturnType<typeof makeLine>> = {}) => ({
    ...makeLine(pepper, PACKS[1], whole, 1),
    ...overrides,
  });

  it("is all zeroes for an empty cart", () => {
    const totals = cartTotals([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(0);
  });

  it("counts quantity, not lines", () => {
    expect(cartItemCount([line({ quantity: 3 }), line({ key: "b", quantity: 2 })])).toBe(5);
  });

  it("sums line totals as unit price times quantity", () => {
    const lines = [line({ quantity: 2 }), line({ key: "b", quantity: 3, unitPrice: 100 })];
    expect(cartSubtotal(lines)).toBe(2 * unitPrice(pepper, PACKS[1], whole) + 300);
  });

  it("charges flat shipping below the free threshold", () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD - 1)).toBe(FLAT_SHIPPING);
  });

  it("waives shipping at exactly the threshold", () => {
    expect(shippingFor(FREE_SHIPPING_THRESHOLD)).toBe(0);
  });

  it("does not charge shipping on an empty cart", () => {
    expect(shippingFor(0)).toBe(0);
  });

  it("reports the remaining spend needed for free delivery", () => {
    const totals = cartTotals([line()]);
    const expected = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal);
    expect(totals.freeShippingRemaining).toBe(expected);
  });

  it("adds GST on the subtotal only, never on shipping", () => {
    const lines = [line({ quantity: 2 })];
    const totals = cartTotals(lines);
    expect(totals.gst).toBe(Math.round(totals.subtotal * GST_RATE));
    expect(totals.total).toBe(totals.subtotal + totals.shipping + totals.gst);
  });
});

describe("makeOrderId", () => {
  it("is prefixed so a demo order is never mistaken for a real one", () => {
    expect(makeOrderId(new Date(2026, 0, 5))).toMatch(/^WS-DEMO-20260105-\d{4}$/);
  });
});
