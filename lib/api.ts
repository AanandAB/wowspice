/**
 * Storefront -> wowspice-api client.
 *
 * `NEXT_PUBLIC_API_URL` points at the deployed Workers API. It is left empty by
 * default (falls back to localhost for `next dev`); set it in the build env when
 * deploying to the real account, e.g. NEXT_PUBLIC_API_URL=https://api.example.in
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export interface PlaceOrderPayload {
  customer: {
    name: string;
    phone?: string;
    email?: string;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: { slug: string; grams: number; grind: string; quantity: number }[];
  deliverySlot?: string;
  consent?: boolean;
}

export interface OrderItem {
  slug?: string;
  name: string;
  packLabel: string;
  grams: number;
  grind: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: string;
  placedAt: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  delivery: number;
  gst: number;
  total: number;
  deliverySlot: string | null;
  customer: {
    name: string;
    phone: string | null;
    line1: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<{ order: OrderResponse }> {
  const res = await fetch(`${API_BASE}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; fields?: unknown };
    throw new Error(body.error ?? `Order failed (${res.status})`);
  }
  return (await res.json()) as { order: OrderResponse };
}

export async function fetchOrder(id: string): Promise<{ order: OrderResponse }> {
  const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Order not found (${res.status})`);
  return (await res.json()) as { order: OrderResponse };
}
