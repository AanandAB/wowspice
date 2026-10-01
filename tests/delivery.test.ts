import { describe, expect, it } from "vitest";
import {
  DELIVERY_ZONES,
  addBusinessDays,
  deliverySlots,
  dispatchDate,
  estimateDelivery,
  isValidPincode,
  zoneForPincode,
} from "@/lib/delivery";

describe("zoneForPincode", () => {
  it("maps a Kerala PIN to the southern zone", () => {
    expect(zoneForPincode("682016")?.id).toBe("south");
  });

  it("maps the north and east circles correctly", () => {
    expect(zoneForPincode("110001")?.id).toBe("north");
    expect(zoneForPincode("700001")?.id).toBe("east");
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "12345", "1234567", "abcdef", "012345", "68201a"]) {
      expect(zoneForPincode(bad)).toBeNull();
      expect(isValidPincode(bad)).toBe(false);
    }
  });

  it("accepts every leading digit that has a zone", () => {
    for (const zone of DELIVERY_ZONES) {
      for (const leading of zone.leading) {
        expect(zoneForPincode(`${leading}00001`)?.id).toBe(zone.id);
      }
    }
  });

  it("tolerates surrounding whitespace", () => {
    expect(zoneForPincode("  682016  ")?.id).toBe("south");
  });
});

describe("addBusinessDays", () => {
  it("skips the weekend", () => {
    // Friday 2026-09-11 + 1 business day = Monday 2026-09-14
    const friday = new Date(2026, 8, 11);
    const result = addBusinessDays(friday, 1);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(14);
  });

  it("never lands on a Saturday or Sunday", () => {
    for (let days = 1; days <= 12; days++) {
      const day = addBusinessDays(new Date(2026, 8, 1), days).getDay();
      expect(day).not.toBe(0);
      expect(day).not.toBe(6);
    }
  });
});

describe("dispatchDate", () => {
  it("pushes a late order to the next working day", () => {
    // Monday 15:00 -> Tuesday
    const monday1500 = new Date(2026, 8, 14, 15, 0);
    expect(dispatchDate(monday1500).getDate()).toBe(15);
  });

  it("keeps a morning order on the same day", () => {
    const monday1000 = new Date(2026, 8, 14, 10, 0);
    expect(dispatchDate(monday1000).getDate()).toBe(14);
  });

  it("never dispatches at the weekend", () => {
    // Friday 16:00 -> should roll past Sat and Sun to Monday
    const friday1600 = new Date(2026, 8, 11, 16, 0);
    const result = dispatchDate(friday1600);
    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(14);
  });
});

describe("estimateDelivery", () => {
  const now = new Date(2026, 8, 14, 9, 0); // Monday morning

  it("returns null for an unserviceable PIN", () => {
    expect(estimateDelivery("000000", now)).toBeNull();
    expect(estimateDelivery("nope", now)).toBeNull();
  });

  it("gives a forward-looking window with earliest no later than latest", () => {
    for (const pin of ["682016", "560001", "400001", "110001", "700001"]) {
      const estimate = estimateDelivery(pin, now);
      expect(estimate).not.toBeNull();
      expect(estimate!.minDays).toBeLessThanOrEqual(estimate!.maxDays);
      expect(estimate!.earliest).not.toBe(estimate!.latest);
      expect(estimate!.zoneLabel.length).toBeGreaterThan(0);
    }
  });

  it("gets slower the further the PIN is from Kerala", () => {
    const kerala = estimateDelivery("682016", now)!;
    const delhi = estimateDelivery("110001", now)!;
    expect(delhi.minDays).toBeGreaterThan(kerala.minDays);
  });

  it("refuses cash on delivery in the eastern zone", () => {
    expect(estimateDelivery("700001", now)!.cod).toBe(false);
    expect(estimateDelivery("682016", now)!.cod).toBe(true);
  });
});

describe("deliverySlots", () => {
  it("only offers cash on delivery where the zone supports it", () => {
    const south = estimateDelivery("682016", new Date(2026, 8, 14, 9, 0))!;
    const east = estimateDelivery("700001", new Date(2026, 8, 14, 9, 0))!;

    expect(deliverySlots(south).some((s) => s.includes("Cash on delivery"))).toBe(true);
    expect(deliverySlots(east).some((s) => s.includes("Cash on delivery"))).toBe(false);
  });
});
