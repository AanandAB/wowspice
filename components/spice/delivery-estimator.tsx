"use client";

import { useId, useState } from "react";
import { estimateDelivery, isValidPincode, type DeliveryEstimate } from "@/lib/delivery";
import { formatINR, FREE_SHIPPING_THRESHOLD } from "@/lib/commerce";

/**
 * Pincode to arrival window.
 *
 * Answers the question a spice buyer actually has ("will this reach me before
 * I need it?") before they get to checkout, using the real postal-circle model
 * in lib/delivery rather than a hardcoded string.
 */
export function DeliveryEstimator() {
  const inputId = useId();
  const errorId = `${inputId}-error`;

  const [pincode, setPincode] = useState("");
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const check = () => {
    const value = pincode.trim();
    if (!isValidPincode(value)) {
      setEstimate(null);
      setError("Enter a valid 6-digit Indian PIN code.");
      setChecked(true);
      return;
    }
    setError(null);
    setEstimate(estimateDelivery(value));
    setChecked(true);
  };

  return (
    <div>
      <label className="ws-label" htmlFor={inputId}>
        Estimate delivery to your PIN code
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          value={pincode}
          onChange={(event) => {
            // Digits only, so a paste with spaces or a stray letter still works.
            setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
            setChecked(false);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              check();
            }
          }}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="682016"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="ws-input w-[150px] font-mono tracking-wider"
        />
        <button type="button" onClick={check} className="ws-btn ws-btn-ghost ws-btn-sm">
          Check
        </button>
      </div>

      {error ? (
        <span id={errorId} className="ws-error" role="alert">
          {error}
        </span>
      ) : null}

      {checked && estimate ? (
        <div className="mt-4 rounded-[var(--radius-surface)] border border-white/10 bg-white/3 p-4">
          <p className="text-[0.9rem] font-medium" style={{ color: "rgb(var(--ws-accent))" }}>
            Arrives {estimate.earliest} – {estimate.latest}
          </p>
          <dl className="mt-3 space-y-1.5 text-[0.82rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-[rgb(var(--ws-paper)/0.6)]">Zone</dt>
              <dd className="text-right">{estimate.zoneLabel}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[rgb(var(--ws-paper)/0.6)]">Transit</dt>
              <dd className="tabular-nums">
                {estimate.minDays}–{estimate.maxDays} working days
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[rgb(var(--ws-paper)/0.6)]">Cash on delivery</dt>
              <dd>{estimate.cod ? "Available" : "Prepaid only for this zone"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[rgb(var(--ws-paper)/0.6)]">Shipping</dt>
              <dd>
                Free above {formatINR(FREE_SHIPPING_THRESHOLD)}, otherwise {formatINR(49)}
              </dd>
            </div>
          </dl>
          <p className="ws-meta mt-3 leading-relaxed">
            Estimates assume dispatch from Kochi on the next working day. Orders placed after 2pm
            go out the following working day.
          </p>
        </div>
      ) : null}
    </div>
  );
}
