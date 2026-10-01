"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Drawer } from "vaul";
import { X } from "@phosphor-icons/react";
import { useCartStore } from "@/store/cart";
import { cartTotals, formatGrams, formatINR } from "@/lib/commerce";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/commerce";
import { useMediaQuery } from "@/lib/use-media-query";

function QuantityStepper({
  quantity,
  onChange,
  label,
}: {
  quantity: number;
  onChange: (next: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center rounded-full border border-white/14">
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        className="flex h-8 w-8 items-center justify-center text-[0.95rem] transition-transform duration-150 ease-out active:scale-90"
        aria-label={`Decrease quantity of ${label}`}
      >
        −
      </button>
      <span className="w-6 text-center text-[0.82rem] font-semibold tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        className="flex h-8 w-8 items-center justify-center text-[0.95rem] transition-transform duration-150 ease-out active:scale-90"
        aria-label={`Increase quantity of ${label}`}
      >
        +
      </button>
    </div>
  );
}

function CartBody({ onNavigate }: { onNavigate: () => void }) {
  const lines = useCartStore((state) => state.lines);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const lastAddedKey = useCartStore((state) => state.lastAddedKey);
  const router = useRouter();

  const totals = cartTotals(lines);

  if (lines.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-14 text-center">
        <div
          aria-hidden
          className="h-14 w-14 rounded-full border border-dashed border-white/20"
          style={{ boxShadow: "inset 0 0 26px rgb(var(--ws-accent) / 0.16)" }}
        />
        <p className="font-display text-lg">Nothing in the basket yet</p>
        <p className="ws-meta max-w-[30ch] leading-relaxed">
          Eleven whole spices, all single-origin. Free delivery once you pass{" "}
          {formatINR(FREE_SHIPPING_THRESHOLD)}.
        </p>
        <Link href="/collection" onClick={onNavigate} className="ws-btn ws-btn-ghost ws-btn-sm mt-2">
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
        <ul className="flex flex-col">
          {lines.map((line) => (
            <li
              key={line.key}
              className={`flex gap-3 border-b border-white/8 py-4 transition-colors duration-500 ${
                line.key === lastAddedKey ? "bg-white/4" : ""
              }`}
            >
              <span
                aria-hidden
                className="mt-0.5 h-10 w-10 flex-none rounded-full"
                style={{
                  background: `radial-gradient(circle at 34% 30%, ${line.accent} 0%, ${line.accent}66 62%, transparent 100%)`,
                }}
              />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/spice/${line.slug}`}
                  onClick={onNavigate}
                  className="block truncate text-[0.9rem] font-semibold hover:underline"
                >
                  {line.name}
                </Link>
                <p className="ws-meta mt-0.5">
                  {line.packLabel} · {formatGrams(line.grams)} · {line.grindLabel}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <QuantityStepper
                    quantity={line.quantity}
                    label={line.name}
                    onChange={(next) => setQuantity(line.key, next)}
                  />
                  <span className="text-[0.88rem] font-semibold tabular-nums">
                    {formatINR(line.unitPrice * line.quantity)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                className="ws-meta h-fit underline transition-colors duration-200 hover:text-[rgb(var(--ws-paper))]"
                aria-label={`Remove ${line.name} from cart`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-white/10 px-5 pt-4 pb-5 sm:px-6">
        {totals.freeShippingRemaining > 0 ? (
          <div className="mb-4">
            <p className="ws-meta">
              {formatINR(totals.freeShippingRemaining)} more for free delivery
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-400 ease-out"
                style={{
                  width: `${Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
                  backgroundColor: "rgb(var(--ws-accent))",
                }}
              />
            </div>
          </div>
        ) : (
          <p className="mb-4 text-[0.8rem] font-medium" style={{ color: "rgb(var(--ws-accent))" }}>
            Free delivery unlocked
          </p>
        )}

        <dl className="space-y-1.5 text-[0.86rem]">
          <div className="flex justify-between">
            <dt className="text-[rgb(var(--ws-paper)/0.66)]">Subtotal</dt>
            <dd className="tabular-nums">{formatINR(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[rgb(var(--ws-paper)/0.66)]">Delivery</dt>
            <dd className="tabular-nums">
              {totals.shippingIsFree ? "Free" : formatINR(totals.shipping)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[rgb(var(--ws-paper)/0.66)]">GST (provisional)</dt>
            <dd className="tabular-nums">{formatINR(totals.gst)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2.5 text-[1rem] font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatINR(totals.total)}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => {
            onNavigate();
            router.push("/checkout");
          }}
          className="ws-btn ws-btn-accent mt-4 w-full"
        >
          Checkout
        </button>
        <p className="ws-meta mt-2.5 text-center">
          Demonstration storefront — no payment is taken
        </p>
      </div>
    </>
  );
}

function PanelShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-[90] bg-black/55 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className="fixed inset-y-0 right-0 z-[100] flex w-[min(420px,92vw)] flex-col border-l border-white/10 bg-[#131010]"
        style={{
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 400ms cubic-bezier(0.32, 0.72, 0, 1)",
          visibility: open ? "visible" : "hidden",
        }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 sm:px-6">
          <h2 className="font-display text-[1.22rem] font-semibold">Your basket</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="ws-icon-btn h-9 w-9"
            aria-label="Close cart"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}

export function CartDrawer() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isOpen = useCartStore((state) => state.isOpen);
  const closeCart = useCartStore((state) => state.closeCart);

  if (isDesktop) {
    return (
      <PanelShell open={isOpen} onClose={closeCart}>
        <CartBody onNavigate={closeCart} />
      </PanelShell>
    );
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => (open ? undefined : closeCart())}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[90] bg-black/60" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[88dvh] flex-col rounded-t-[24px] border-t border-white/10 bg-[#131010] outline-none"
          aria-describedby="cart-sheet-description"
        >
          <Drawer.Title className="sr-only">Your basket</Drawer.Title>
          <Drawer.Description id="cart-sheet-description" className="sr-only">
            Items currently in your basket, with delivery and totals.
          </Drawer.Description>

          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <span aria-hidden className="h-1.5 w-10 rounded-full bg-white/20" />
            <button
              type="button"
              onClick={closeCart}
              className="ws-icon-btn h-9 w-9"
              aria-label="Close cart"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
          <h2 className="px-5 pb-2 font-display text-[1.22rem] font-semibold">Your basket</h2>
          <CartBody onNavigate={closeCart} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
