"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { useOrder } from "@/store/orders";
import { formatGrams, formatINR } from "@/lib/commerce";
import { paletteStyle, SPICES } from "@/data/spices";
import { BodyTheme } from "@/components/site/body-theme";

/**
 * Order confirmation, static-host edition.
 *
 * Reads the order back from the browser-local store. The id now travels as a
 * query parameter (`/order?id=…`) rather than a path segment, because a static
 * export has no server to match arbitrary `[id]` values. There is no backend, so
 * an order placed in a different browser (or after clearing storage) genuinely
 * will not be found — the not-found state says so plainly.
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
  const { order, hydrated } = useOrder(id);

  const shell = (children: React.ReactNode) => (
    <div style={paletteStyle(SPICES[1])}>
      <BodyTheme accent={SPICES[1].palette.accent} bg={SPICES[1].palette.bg} />
      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-28 pb-24 sm:px-8">{children}</div>
    </div>
  );

  if (!hydrated) {
    return shell(
      <div>
        <div className="ws-skeleton h-8 w-56" />
        <div className="ws-skeleton mt-6 h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return shell(
      <div className="text-center">
        <h1 className="ws-display-lg">We cannot find that order</h1>
        <p className="ws-body mx-auto mt-4">
          Orders are stored in the browser that placed them, and this one is not here. If you placed
          it in a different browser or cleared your storage, that is the reason.
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
        Thank you. In a real store you would now get an email with a tracking reference — this
        demonstration build records the order in this browser only and takes no payment.
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
          { term: "Delivery method", value: order.deliverySlot },
          {
            term: "Delivering to",
            value: `${order.address.name}, ${order.address.line1}, ${order.address.city}, ${order.address.state} ${order.address.pincode}`,
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
        {order.lines.map((line) => (
          <li key={line.key} className="flex items-center gap-4 py-4">
            <span
              aria-hidden
              className="h-9 w-9 flex-none rounded-full"
              style={{
                background: `radial-gradient(circle at 34% 30%, ${line.accent} 0%, ${line.accent}55 62%, transparent 100%)`,
              }}
            />
            <div className="min-w-0 flex-1">
              <Link href={`/spice/${line.slug}`} className="text-[0.9rem] font-medium hover:underline">
                {line.name}
              </Link>
              <p className="ws-meta mt-0.5">
                {line.packLabel} · {formatGrams(line.grams)} · {line.grindLabel} × {line.quantity}
              </p>
            </div>
            <span className="text-[0.9rem] tabular-nums">
              {formatINR(line.unitPrice * line.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 text-[0.9rem]">
        <div className="flex justify-between">
          <dt className="text-[rgb(var(--ws-paper)/0.62)]">Subtotal</dt>
          <dd className="tabular-nums">{formatINR(order.totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[rgb(var(--ws-paper)/0.62)]">Delivery</dt>
          <dd className="tabular-nums">
            {order.totals.shippingIsFree ? "Free" : formatINR(order.totals.shipping)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[rgb(var(--ws-paper)/0.62)]">GST (provisional)</dt>
          <dd className="tabular-nums">{formatINR(order.totals.gst)}</dd>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-3 text-[1.05rem] font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatINR(order.totals.total)}</dd>
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
