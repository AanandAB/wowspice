"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "@phosphor-icons/react";
import { useCartStore } from "@/store/cart";
import { cartTotals, formatGrams, formatINR } from "@/lib/commerce";
import { placeOrder } from "@/lib/api";
import { deliverySlots, estimateDelivery, isValidPincode } from "@/lib/delivery";
import { paletteStyle, SPICES } from "@/data/spices";
import { BodyTheme } from "@/components/site/body-theme";

interface Address {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS: Address = {
  name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const STEPS = ["Delivery address", "Delivery method", "Review and place"] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const lines = useCartStore((state) => state.lines);
  const clear = useCartStore((state) => state.clear);
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [slot, setSlot] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [consent, setConsent] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const totals = cartTotals(lines);

  const estimate = useMemo(
    () => (isValidPincode(address.pincode) ? estimateDelivery(address.pincode) : null),
    [address.pincode]
  );

  const slots = estimate ? deliverySlots(estimate) : [];

  const set = <K extends keyof Address>(key: K, value: Address[K]) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateAddress = (): boolean => {
    const found: Partial<Record<keyof Address, string>> = {};
    if (!address.name.trim()) found.name = "Required so the courier knows who to ask for.";
    if (!/^[+\d][\d\s-]{7,}$/.test(address.phone.trim())) {
      found.phone = "A reachable phone number, digits only.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
      found.email = "We send the tracking reference here.";
    }
    if (!address.line1.trim()) found.line1 = "Street address is required.";
    if (!address.city.trim()) found.city = "City or town is required.";
    if (!address.state.trim()) found.state = "State is required.";
    if (!isValidPincode(address.pincode)) {
      found.pincode = "Enter a valid 6-digit Indian PIN code we can deliver to.";
    }
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const onPlace = async () => {
    if (!slot || !consent) return;
    setPlacing(true);
    setPlaceError(null);
    try {
      const { order } = await placeOrder({
        customer: {
          name: address.name,
          phone: address.phone,
          email: address.email,
          line1: [address.line1, address.line2].filter(Boolean).join(", "),
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        items: lines.map((line) => ({
          slug: line.slug,
          grams: line.grams,
          grind: line.grindId,
          quantity: line.quantity,
        })),
        deliverySlot: slot,
        consent: true,
      });
      clear();
      router.push(`/order?id=${order.id}`);
    } catch {
      setPlaceError("We could not place your order. Please try again.");
      setPlacing(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div style={paletteStyle(SPICES[0])}>
        <BodyTheme accent={SPICES[0].palette.accent} bg={SPICES[0].palette.bg} />
        <div className="relative z-10 mx-auto flex min-h-[70dvh] max-w-6xl flex-col items-center justify-center px-5 py-32 text-center sm:px-8">
          <h1 className="ws-display-lg">Nothing to check out</h1>
          <p className="ws-body mt-4">
            Your basket is empty. Add a spice and the delivery estimate will appear here.
          </p>
          <Link href="/collection" className="ws-btn ws-btn-ghost mt-8">
            Browse the collection
          </Link>
        </div>
      </div>
    );
  }

  const inputFor = (key: keyof Address, label: string, opts: { type?: string; help?: string; required?: boolean; autoComplete?: string } = {}) => {
    const id = `checkout-${key}`;
    const errorId = `${id}-error`;
    return (
      <div>
        <label className="ws-label" htmlFor={id}>
          {label}
          {opts.required ? <span aria-hidden> *</span> : null}
        </label>
        <input
          id={id}
          name={key}
          type={opts.type ?? "text"}
          value={address[key]}
          autoComplete={opts.autoComplete}
          onChange={(event) => set(key, event.target.value)}
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={errors[key] ? errorId : undefined}
          className="ws-input"
        />
        {errors[key] ? (
          <span id={errorId} className="ws-error" role="alert">
            {errors[key]}
          </span>
        ) : opts.help ? (
          <p className="ws-meta mt-1.5">{opts.help}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div style={paletteStyle(SPICES[0])}>
      <BodyTheme accent={SPICES[0].palette.accent} bg={SPICES[0].palette.bg} />

      <div className="relative z-10 mx-auto max-w-5xl px-5 pt-28 pb-24 sm:px-8">
        <Link
          href="/collection"
          className="inline-flex items-center gap-2 text-[0.85rem] text-[rgb(var(--ws-paper)/0.7)] transition-colors duration-200 hover:text-[rgb(var(--ws-paper))]"
        >
          <ArrowLeft size={14} weight="bold" />
          Keep shopping
        </Link>

        <h1 className="ws-display-lg mt-7">Checkout</h1>

        {/* ---- progress ---- */}
        <ol className="mt-8 flex flex-wrap gap-x-6 gap-y-3" aria-label="Checkout progress">
          {STEPS.map((label, index) => {
            const state = index === step ? "current" : index < step ? "done" : "upcoming";
            return (
              <li key={label} className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="flex h-6 w-6 items-center justify-center rounded-full border text-[0.7rem] font-semibold"
                  style={{
                    borderColor:
                      state === "upcoming" ? "rgb(255 255 255 / 0.18)" : "rgb(var(--ws-accent))",
                    background:
                      state === "upcoming" ? "transparent" : "rgb(var(--ws-accent) / 0.16)",
                    color: state === "upcoming" ? "rgb(var(--ws-paper) / 0.5)" : "rgb(var(--ws-paper))",
                  }}
                >
                  {state === "done" ? <Check size={12} weight="bold" /> : index + 1}
                </span>
                <span
                  className="text-[0.85rem]"
                  style={{
                    color:
                      state === "current"
                        ? "rgb(var(--ws-paper))"
                        : "rgb(var(--ws-paper) / 0.52)",
                  }}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div>
            {step === 0 ? (
              <section aria-labelledby="address-heading">
                <h2 id="address-heading" className="ws-display-md mb-6">
                  Where is it going?
                </h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {inputFor("name", "Full name", { required: true, autoComplete: "name" })}
                    {inputFor("phone", "Phone", {
                      required: true,
                      type: "tel",
                      autoComplete: "tel",
                      help: "Couriers call before delivering.",
                    })}
                  </div>
                  {inputFor("email", "Email", { required: true, type: "email", autoComplete: "email" })}
                  {inputFor("line1", "Address", { required: true, autoComplete: "address-line1" })}
                  {inputFor("line2", "Apartment, landmark", { autoComplete: "address-line2" })}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {inputFor("city", "City", { required: true, autoComplete: "address-level2" })}
                    {inputFor("state", "State", { required: true, autoComplete: "address-level1" })}
                    {inputFor("pincode", "PIN code", { required: true, autoComplete: "postal-code" })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (validateAddress()) setStep(1);
                  }}
                  className="ws-btn ws-btn-accent mt-8"
                >
                  Continue to delivery
                </button>
              </section>
            ) : null}

            {step === 1 ? (
              <section aria-labelledby="method-heading">
                <h2 id="method-heading" className="ws-display-md mb-3">
                  How should it travel?
                </h2>
                {estimate ? (
                  <p className="ws-meta mb-7">
                    {address.pincode} · {estimate.zoneLabel} · arriving {estimate.earliest} to{" "}
                    {estimate.latest}
                  </p>
                ) : null}

                <div className="space-y-3">
                  {slots.map((option) => {
                    const active = option === slot;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSlot(option)}
                        aria-pressed={active}
                        className="w-full rounded-[var(--radius-surface)] border px-5 py-4 text-left text-[0.9rem] transition-colors duration-200"
                        style={{
                          borderColor: active
                            ? "rgb(var(--ws-accent))"
                            : "rgb(255 255 255 / 0.14)",
                          background: active ? "rgb(var(--ws-accent) / 0.1)" : "transparent",
                        }}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setStep(0)} className="ws-btn ws-btn-ghost">
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!slot}
                    onClick={() => setStep(2)}
                    className="ws-btn ws-btn-accent"
                  >
                    Review order
                  </button>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section aria-labelledby="review-heading">
                <h2 id="review-heading" className="ws-display-md mb-6">
                  Check it over
                </h2>

                <dl className="ws-rule space-y-5 pt-6 text-[0.88rem]">
                  <div>
                    <dt className="ws-meta">Delivering to</dt>
                    <dd className="mt-1.5 leading-relaxed">
                      {address.name}
                      <br />
                      {[address.line1, address.line2].filter(Boolean).join(", ")}
                      <br />
                      {address.city}, {address.state} {address.pincode}
                      <br />
                      {address.phone} · {address.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="ws-meta">Method</dt>
                    <dd className="mt-1.5">{slot}</dd>
                  </div>
                </dl>

                <ul className="ws-rule mt-6 divide-y divide-white/8 border-t border-white/10 pt-2">
                  {lines.map((line) => (
                    <li key={line.key} className="flex items-center justify-between gap-4 py-3.5">
                      <div>
                        <p className="text-[0.9rem] font-medium">{line.name}</p>
                        <p className="ws-meta mt-0.5">
                          {line.packLabel} · {formatGrams(line.grams)} · {line.grindLabel} ×{" "}
                          {line.quantity}
                        </p>
                      </div>
                      <span className="text-[0.9rem] tabular-nums">
                        {formatINR(line.unitPrice * line.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <label className="mt-8 flex items-start gap-3 text-[0.84rem] leading-relaxed">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-4 w-4 flex-none accent-[rgb(var(--ws-accent))]"
                  />
                  <span className="text-[rgb(var(--ws-paper)/0.72)]">
                    I consent to wowspice using these details to process and deliver this order.
                  </span>
                </label>

                {placeError ? (
                  <p className="mt-3 text-[0.84rem] text-[#f08a72]" role="alert">
                    {placeError}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => setStep(1)} className="ws-btn ws-btn-ghost">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onPlace}
                    disabled={placing || !consent}
                    className="ws-btn ws-btn-accent"
                  >
                    {placing ? "Placing…" : `Place order · ${formatINR(totals.total)}`}
                  </button>
                </div>

                <p className="ws-meta mt-4 leading-relaxed">
                  Your order is recorded and sent to the shop. No payment is taken online yet.
                </p>
              </section>
            ) : null}
          </div>

          {/* ---- summary ---- */}
          <aside className="self-start rounded-[var(--radius-surface)] border border-white/10 bg-white/3 p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-[1.05rem] font-semibold">Order summary</h2>
            <p className="ws-meta mt-1.5">
              {totals.itemCount} {totals.itemCount === 1 ? "item" : "items"}
            </p>

            <dl className="mt-5 space-y-2 text-[0.86rem]">
              <div className="flex justify-between">
                <dt className="text-[rgb(var(--ws-paper)/0.62)]">Subtotal</dt>
                <dd className="tabular-nums">{formatINR(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[rgb(var(--ws-paper)/0.62)]">Delivery</dt>
                <dd className="tabular-nums">
                  {totals.shippingIsFree ? "Free" : formatINR(totals.shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[rgb(var(--ws-paper)/0.62)]">GST (provisional)</dt>
                <dd className="tabular-nums">{formatINR(totals.gst)}</dd>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-[1rem] font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatINR(totals.total)}</dd>
              </div>
            </dl>

            {totals.freeShippingRemaining > 0 ? (
              <p className="ws-meta mt-4">
                {formatINR(totals.freeShippingRemaining)} more for free delivery.
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
