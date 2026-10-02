"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ShoppingBag } from "@phosphor-icons/react";
import { GRINDS, PACKS, type GrindOption, type Spice } from "@/data/spices";
import { formatGrams, formatINR, makeLine, pricePer100g, unitPrice } from "@/lib/commerce";
import { useCartStore } from "@/store/cart";
import { useResolvedSpice } from "@/lib/catalog";

/**
 * Purchase controls.
 *
 * Price is derived, never stored: `unitPrice` rounds once at the end, so the
 * per-100 g comparison and the line total can never disagree with each other.
 */
export function BuyPanel({ spice }: { spice: Spice }) {
  const addLine = useCartStore((state) => state.addLine);
  const resolved = useResolvedSpice(spice);

  const [packIndex, setPackIndex] = useState(1); // 250 g default
  const [grind, setGrind] = useState<GrindOption>(GRINDS[0]);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const pack = PACKS[packIndex];

  const { price, per100, lineTotal } = useMemo(
    () => ({
      price: unitPrice(resolved, pack, grind),
      per100: pricePer100g(resolved, pack, grind),
      lineTotal: unitPrice(resolved, pack, grind) * quantity,
    }),
    [resolved, pack, grind, quantity]
  );

  const basePack = PACKS[0];
  const basePer100 = pricePer100g(resolved, basePack, grind);
  const saving = Math.round((1 - per100 / basePer100) * 100);

  const onAdd = () => {
    addLine(makeLine(resolved, pack, grind, quantity));
    toast.success(`Added ${quantity} × ${spice.name} · ${pack.label}`, {
      description: `${grind.label} · ${formatINR(lineTotal)}`,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className="ws-price-lg">{formatINR(price)}</span>
        <span className="ws-meta">
          {formatGrams(pack.grams)} · {formatINR(Math.round(per100))} per 100 g
        </span>
      </div>
      {saving > 0 ? (
        <p className="mt-1.5 text-[0.8rem]" style={{ color: "rgb(var(--ws-accent))" }}>
          {saving}% cheaper per gram than the 100 g pack
        </p>
      ) : null}

      {/* ---- pack size ---- */}
      <fieldset className="mt-7">
        <legend className="ws-label">Pack size</legend>
        <div className="flex flex-wrap gap-2">
          {PACKS.map((option, index) => {
            const active = index === packIndex;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setPackIndex(index)}
                aria-pressed={active}
                className="rounded-[var(--radius-control)] border px-4 py-2 text-[0.85rem] font-medium transition-colors duration-200"
                style={{
                  background: active ? "var(--ws-paper)" : "transparent",
                  color: active ? "#100d0c" : "rgb(var(--ws-paper) / 0.82)",
                  borderColor: active ? "var(--ws-paper)" : "rgb(255 255 255 / 0.16)",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ---- whole or ground ---- */}
      <fieldset className="mt-6">
        <legend className="ws-label">Whole or ground</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GRINDS.map((option) => {
            const active = option.id === grind.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setGrind(option)}
                aria-pressed={active}
                className="rounded-[var(--radius-surface)] border px-4 py-3 text-left transition-colors duration-200"
                style={{
                  borderColor: active ? "rgb(var(--ws-accent))" : "rgb(255 255 255 / 0.14)",
                  background: active ? "rgb(var(--ws-accent) / 0.1)" : "transparent",
                }}
              >
                <span className="block text-[0.88rem] font-semibold">{option.label}</span>
                <span className="ws-meta mt-1 block leading-relaxed">{option.note}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* ---- quantity + add ---- */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-[var(--radius-control)] border border-white/14">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center text-[1.05rem] transition-transform duration-150 ease-out active:scale-90"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-9 text-center font-semibold tabular-nums">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            className="flex h-11 w-11 items-center justify-center text-[1.05rem] transition-transform duration-150 ease-out active:scale-90"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button type="button" onClick={onAdd} className="ws-btn ws-btn-accent flex-1 sm:flex-none">
          {justAdded ? <Check size={16} weight="bold" /> : <ShoppingBag size={16} weight="bold" />}
          {justAdded ? "Added" : `Add to basket · ${formatINR(lineTotal)}`}
        </button>
      </div>

      <p className="ws-meta mt-3">
        Dispatched from Kochi in two working days. Batch number printed on the pouch.
      </p>
    </div>
  );
}
