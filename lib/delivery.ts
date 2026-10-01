/**
 * Delivery estimation.
 *
 * Dispatch is from Kochi (Kerala, PIN 68xxxx). Indian PIN codes are allocated
 * by postal circle, and the first digit maps to a region, which is a real and
 * usable signal for transit time — far better than a random number, and it
 * degrades sensibly for any valid PIN.
 *
 * This is a models-and-estimates engine, not a courier API. The wording in the
 * UI says "estimated" for that reason.
 */

export interface DeliveryZone {
  id: string;
  /** First PIN digit(s) belonging to this zone. */
  leading: string[];
  label: string;
  /** Transit days from Kochi, before the dispatch cut-off is applied. */
  minDays: number;
  maxDays: number;
  /** Whether cash on delivery is offered into this zone. */
  cod: boolean;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "south",
    leading: ["6"],
    label: "Kerala, Tamil Nadu & Puducherry",
    minDays: 2,
    maxDays: 3,
    cod: true,
  },
  {
    id: "south-west",
    leading: ["5"],
    label: "Karnataka, Andhra Pradesh, Telangana & Goa",
    minDays: 2,
    maxDays: 4,
    cod: true,
  },
  {
    id: "west",
    leading: ["3", "4"],
    label: "Maharashtra, Gujarat, Madhya Pradesh & Chhattisgarh",
    minDays: 3,
    maxDays: 5,
    cod: true,
  },
  {
    id: "north",
    leading: ["1", "2"],
    label: "Delhi, Punjab, Haryana, Himachal & Uttar Pradesh",
    minDays: 4,
    maxDays: 6,
    cod: true,
  },
  {
    id: "east",
    leading: ["7", "8"],
    label: "West Bengal, Odisha, Bihar, Jharkhand & the North East",
    minDays: 5,
    maxDays: 8,
    // Remote and North Eastern pincodes are prepaid only; the couriers we can
    // rely on do not carry cash for these routes.
    cod: false,
  },
];

export interface DeliveryEstimate {
  pincode: string;
  zoneId: string;
  zoneLabel: string;
  minDays: number;
  maxDays: number;
  earliest: string;
  latest: string;
  cod: boolean;
}

/** Null when the input is not a plausibly serviceable Indian PIN code. */
export function zoneForPincode(pincode: string): DeliveryZone | null {
  const trimmed = pincode.trim();
  if (!/^[1-9]\d{5}$/.test(trimmed)) return null;
  const first = trimmed[0];
  return DELIVERY_ZONES.find((z) => z.leading.includes(first)) ?? null;
}

export function isValidPincode(pincode: string): boolean {
  return zoneForPincode(pincode) !== null;
}

/** Adds N business days, skipping Saturday and Sunday. */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from.getTime());
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

/** Orders placed after this hour are dispatched the following working day. */
export const DISPATCH_CUTOFF_HOUR = 14;

export function dispatchDate(from: Date = new Date()): Date {
  const result = new Date(from.getTime());
  if (result.getHours() >= DISPATCH_CUTOFF_HOUR) {
    result.setDate(result.getDate() + 1);
  }
  // Never dispatch on a weekend.
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function estimateDelivery(pincode: string, now: Date = new Date()): DeliveryEstimate | null {
  const zone = zoneForPincode(pincode);
  if (!zone) return null;

  const from = dispatchDate(now);
  const earliest = addBusinessDays(from, zone.minDays);
  const latest = addBusinessDays(from, zone.maxDays);

  return {
    pincode: pincode.trim(),
    zoneId: zone.id,
    zoneLabel: zone.label,
    minDays: zone.minDays,
    maxDays: zone.maxDays,
    earliest: formatDate(earliest),
    latest: formatDate(latest),
    cod: zone.cod,
  };
}

/** The choices offered at checkout, filtered to what the zone supports. */
export function deliverySlots(estimate: DeliveryEstimate): string[] {
  const slots = [
    `Standard — arrives ${estimate.earliest} to ${estimate.latest}`,
    "Priority dispatch (next working day, ₹120)",
  ];
  if (estimate.cod) slots.push("Cash on delivery at standard rates");
  return slots;
}
