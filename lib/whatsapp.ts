import type { OrderResponse } from "./api";
import { formatINR } from "./commerce";

/**
 * Manual WhatsApp notify — zero ban risk, no gateway.
 *
 * Builds a wa.me deep-link to the shop number with the order pre-filled. The
 * person taps Send on their own device; nothing is sent programmatically.
 * `NEXT_PUBLIC_WHATSAPP_NUMBER` overrides the default shop number.
 */

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919747214649";

export function orderWhatsAppLink(order: OrderResponse): string {
  const lines = [
    `*New order ${order.id}*`,
    `Customer: ${order.customer.name}`,
    order.customer.phone ? `Phone: ${order.customer.phone}` : null,
    `Address: ${order.customer.line1}, ${order.customer.city}, ${order.customer.state} ${order.customer.pincode}`,
    ``,
    `Items:`,
    ...order.items.map(
      (i) => `- ${i.quantity} x ${i.name} (${i.packLabel}) = ${formatINR(i.lineTotal)}`
    ),
    ``,
    `Total: ${formatINR(order.total)}`,
    `Delivery: ${order.deliverySlot ?? "Standard"}`,
  ].filter((line): line is string => line !== null);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
