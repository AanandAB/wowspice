"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOut, WhatsappLogo } from "@phosphor-icons/react";
import { adminFetch, adminToken, clearAdminToken } from "@/lib/admin";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { formatINR } from "@/lib/commerce";
import { paletteStyle, SPICES } from "@/data/spices";
import { BodyTheme } from "@/components/site/body-theme";

interface AdminItem {
  product_name: string;
  pack_label: string;
  grams: number;
  grind: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface AdminOrder {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  address_line1: string;
  address_city: string;
  address_state: string;
  address_pincode: string;
  delivery_slot: string | null;
  subtotal: number;
  delivery: number;
  gst: number;
  total: number;
  status: string;
  payment_status: string;
  created_at: number;
  items: AdminItem[];
}

function waLink(order: AdminOrder): string {
  const lines = [
    `*Order ${order.id}*`,
    `Customer: ${order.customer_name}`,
    order.customer_phone ? `Phone: ${order.customer_phone}` : null,
    `Address: ${order.address_line1}, ${order.address_city}, ${order.address_state} ${order.address_pincode}`,
    ``,
    ...order.items.map((i) => `- ${i.quantity} x ${i.product_name} (${i.pack_label}) = ${formatINR(i.line_total)}`),
    ``,
    `Total: ${formatINR(order.total)}`,
  ].filter((line): line is string => line !== null);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken()) {
      router.push("/admin/login");
      return;
    }
    adminFetch<{ orders: AdminOrder[] }>("/api/admin/orders")
      .then((d) => setOrders(d.orders))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load orders."));
  }, [router]);

  const signOut = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  return (
    <div style={paletteStyle(SPICES[0])}>
      <BodyTheme accent={SPICES[0].palette.accent} bg={SPICES[0].palette.bg} />
      <div className="relative z-10 mx-auto max-w-4xl px-5 pt-28 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="ws-display-lg">Orders</h1>
          <div className="flex gap-2">
            <Link href="/admin/products" className="ws-btn ws-btn-ghost ws-btn-sm">
              Products
            </Link>
            <button onClick={signOut} className="ws-btn ws-btn-ghost ws-btn-sm">
              <SignOut size={14} weight="bold" /> Sign out
            </button>
          </div>
        </div>

        {error ? (
          <p className="ws-error mt-6" role="alert">
            {error}
          </p>
        ) : null}
        {orders === null && !error ? <div className="ws-skeleton mt-8 h-40 w-full" /> : null}
        {orders !== null && orders.length === 0 ? <p className="ws-meta mt-8">No orders yet.</p> : null}

        <div className="mt-8 space-y-4">
          {orders?.map((order) => (
            <div key={order.id} className="rounded-[var(--radius-surface)] border border-white/10 bg-white/3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.8rem] text-[rgb(var(--ws-paper)/0.6)]">{order.id}</p>
                  <p className="mt-1 font-semibold">
                    {order.customer_name} · {formatINR(order.total)}
                  </p>
                  <p className="ws-meta mt-1">
                    {order.address_line1}, {order.address_city} {order.address_pincode} ·{" "}
                    {order.customer_phone ?? "no phone"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/12 px-3 py-1 text-[0.72rem] uppercase">
                    {order.status}
                  </span>
                  <a
                    href={waLink(order)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ws-btn ws-btn-accent ws-btn-sm"
                  >
                    <WhatsappLogo size={14} weight="fill" /> WhatsApp
                  </a>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-white/8 border-t border-white/10 pt-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between py-2 text-[0.85rem]">
                    <span>
                      {item.quantity} × {item.product_name} ({item.pack_label})
                    </span>
                    <span className="tabular-nums">{formatINR(item.line_total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
