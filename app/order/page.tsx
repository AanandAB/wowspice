"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { fetchOrder, type OrderResponse } from "@/lib/api";
import { formatGrams, formatINR } from "@/lib/commerce";
import { paletteStyle, SPICES } from "@/data/spices";
import { BodyTheme } from "@/components/site/body-theme";

const GRIND_LABELS: Record<string, string> = {
  whole: "Whole",
  ground: "Ground to order",
};

/**
 * Order confirmation, read back from the wowspice API.
 *
 * The id travels as a query parameter (`/order?id=…`) because the storefront is
 * a static export with no server to match arbitrary path ids. The order itself
 * lives in D1, so it survives the browser that placed it.
 */
export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div style={paletteStyle(SPICES[1])}>
          <BodyTheme accent={SPICES[1].palette.accent} bg={SPICES[1].palette.bg} />
          <div className="ws-skeleton mx-auto mt-28 h-40 max-w-3xl" />
        </div>
      }
    >
      <OrderContent />
    </Suspense>
  );
}

function OrderContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";

  const [state, setState] = useState<{
    status: "loading" | "ready" | "missing";
    order?: OrderResponse;
  }>({ status: "loading" });

  useEffect(() => {
    if (!id) {
      setState({ status: "missing" });
      return;
    }
    let cancelled = false;
    fetchOrder(id)
      .then(({ order }) => {
        if (!cancelled) setState({ status: "ready", order });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "missing" });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const shell = (children: React.ReactNode) => (
    <div style={paletteStyle(SPICES[1])}>
      <BodyTheme accent={SPICES[1].palette.accent} bg={SPICES[1].palette.bg} />
      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-28 pb-24 sm:px-8">{children}</div>
    </div>
  );

  if (state.status === "loading") {
    return shell(
      <div>
        <div className="ws-skeleton h-8 w-56" />
        <div className="ws-skeleton mt-6 h-40 w-full" />
      </div>
    );
  }

  if (state.status === "missing" || !state.order) {
    return shell(
      <div className="text-center">
        <h1 className="ws-display-lg">We cannot find that order</h1>
        <p className="ws-body mx-auto mt-4">
          That order number does not match anything we have. Double-check the link, or if you just
          placed it, it may take a moment to appear.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/collection" className="ws-btn ws-btn-ghost">
            Back to the collection
          </Link>
          <Link href="/delivery" className="ws-btn ws-btn-ghost">
            Delivery and returns
          </Link>
        </div>
      </div>
    );
  }

  const order = state.order;
  const placed = new Date(order.placedAt);

  return shell(
    <>
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "rgb(var(--ws-accent) / 0.18)" }}
      >
        <Check size={22} weight="bold" />
      </span>

      <h1 className="ws-display-lg mt-6">Order placed</h1>
      <p className="ws-body mt-4">
        Thank you. Your order is recorded and the shop will confirm shortly. No payment was taken
        online.
      </p>

      <dl className="ws-rule mt-9 grid grid-cols-1 gap-6 pt-7 sm:grid-cols-2">
        {[
          { term: "Order number", value: order.id },
          {
            term: "Placed",
            value: placed.toLocaleString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          { term: "Delivery method", value: order.deliverySlot ?? "Standard" },
          {
            term: "Delivering to",
            value: `${order.customer.name}, ${order.customer.line1}, ${order.customer.city}, ${order.customer.state} ${order.customer.pincode}`,
          },
        ].map((row) => (
          <div key={row.term}>
            <dt className="ws-meta">{row.term}</dt>
            <dd className="mt-1.5 text-[0.9rem] break-words">{row.value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="ws-display-md mt-12">What you ordered</h2>
      <ul className="mt-6 divide-y divide-white/8 border-y border-white/10">
        {order.items.map((line) => (
          <li key={`${line.slug ?? line.name}-${line.grams}-${line.grind}`} className="flex items-center gap-4 py-4">
            <span
              aria-hidden
              className="h-9 w-9 flex-none rounded-full"
              style={{ background: "rgb(var(--ws-accent) / 0.22)" }}
            />
            <div className="min-w-0 flex-1">
              {line.slug ? (
                <Link href={`/spice/${line.slug}`} className="text-[0.9rem] font-medium hover:underline">
                  {line.name}
                </Link>
              ) : (
                <span className="text-[0.9rem] font-medium">{line.name}</span>
              )}
              <p className="ws-meta mt-0.5">
                {line.packLabel} · {formatGrams(line.grams)} · {GRIND_LABELS[line.grind] ?? line.grind} ×{" "}
                {line.quantity}
              </p>
            </div>
            <span className="text-[0.9rem] tabular-nums">{formatINR(line.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 text-[0.9rem]">
        <div className="flex justify-between">
          <dt className="text-[rgb(var(--ws-paper)/0.62)]">Subtotal</dt>
          <dd className="tabular-nums">{formatINR(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[rgb(var(--ws-paper)/0.62)]">Delivery</dt>
          <dd className="tabular-nums">{order.delivery === 0 ? "Free" : formatINR(order.delivery)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[rgb(var(--ws-paper)/0.62)]">GST (provisional)</dt>
          <dd className="tabular-nums">{formatINR(order.gst)}</dd>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-3 text-[1.05rem] font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatINR(order.total)}</dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/collection" className="ws-btn ws-btn-ghost">
          Continue shopping
        </Link>
        <Link href="/farms" className="ws-btn ws-btn-ghost">
          Where this came from
        </Link>
      </div>
    </>
  );
}
