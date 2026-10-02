"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOut, Warning } from "@phosphor-icons/react";
import { adminFetch, adminToken, clearAdminToken } from "@/lib/admin";
import { formatINR } from "@/lib/commerce";
import { paletteStyle, SPICES } from "@/data/spices";
import { BodyTheme } from "@/components/site/body-theme";

interface PricingProduct {
  id: string;
  slug: string;
  name: string;
  cp: number;
  sp: number;
  sp_mode: string;
  stock_grams: number;
  image_url: string | null;
  min_sp: number;
  below_min: boolean;
}

interface PricingResponse {
  margin_pct: number;
  total_expenses: number;
  expense_per_100g: number;
  products: PricingProduct[];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<PricingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    adminFetch<PricingResponse>("/api/admin/pricing")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."));
  }, []);

  useEffect(() => {
    if (!adminToken()) {
      router.push("/admin/login");
      return;
    }
    load();
  }, [router, load]);

  const save = async (product: PricingProduct, patch: Partial<PricingProduct>) => {
    setSaving(product.id);
    setError(null);
    try {
      await adminFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      load(); // re-fetch: min_sp depends on global expenses + stock
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(null);
    }
  };

  const signOut = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  return (
    <div style={paletteStyle(SPICES[0])}>
      <BodyTheme accent={SPICES[0].palette.accent} bg={SPICES[0].palette.bg} />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pt-28 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="ws-display-lg">Products &amp; pricing</h1>
          <div className="flex gap-2">
            <Link href="/admin/orders" className="ws-btn ws-btn-ghost ws-btn-sm">
              Orders
            </Link>
            <Link href="/admin/expenses" className="ws-btn ws-btn-ghost ws-btn-sm">
              Expenses
            </Link>
            <button onClick={signOut} className="ws-btn ws-btn-ghost ws-btn-sm">
              <SignOut size={14} weight="bold" /> Sign out
            </button>
          </div>
        </div>

        {data ? (
          <p className="ws-meta mt-6">
            Margin {data.margin_pct}% · Other expenses {formatINR(data.total_expenses)} · expense share{" "}
            {formatINR(Math.round(data.expense_per_100g))}/100 g. Min SP = (CP + expense share) × 1.
            {String(data.margin_pct).padStart(2, "0")}.
          </p>
        ) : null}

        {error ? (
          <p className="ws-error mt-6" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          {data?.products.map((product) => (
            <ProductRow key={product.id} product={product} saving={saving === product.id} onSave={save} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  saving,
  onSave,
}: {
  product: PricingProduct;
  saving: boolean;
  onSave: (p: PricingProduct, patch: Partial<PricingProduct>) => void;
}) {
  const [cp, setCp] = useState(String(product.cp));
  const [sp, setSp] = useState(String(product.sp));
  const [stock, setStock] = useState(String(product.stock_grams));
  const [image, setImage] = useState(product.image_url ?? "");

  const dirty =
    Number(cp) !== product.cp ||
    Number(sp) !== product.sp ||
    Number(stock) !== product.stock_grams ||
    image !== (product.image_url ?? "");

  const spBelowMin = Number(sp) < product.min_sp;

  return (
    <div className="rounded-[var(--radius-surface)] border border-white/10 bg-white/3 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-semibold">{product.name}</p>
          <span className="ws-meta tabular-nums">min SP {formatINR(product.min_sp)}/100 g</span>
          {spBelowMin ? (
            <span
              className="flex items-center gap-1 text-[0.74rem] text-[#f0b429]"
              title="Selling price is below the computed minimum"
            >
              <Warning size={13} weight="fill" /> below min
            </span>
          ) : null}
        </div>
        <button
          disabled={saving || !dirty}
          onClick={() =>
            onSave(product, {
              cp: Number(cp),
              sp: Number(sp),
              stock_grams: Number(stock),
              image_url: image.trim() || null,
            })
          }
          className="ws-btn ws-btn-accent ws-btn-sm"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Cost price (₹/100g)" value={cp} onChange={setCp} />
        <Field label="Selling price (₹/100g)" value={sp} onChange={setSp} warn={spBelowMin} />
        <Field label="Stock (grams)" value={stock} onChange={setStock} />
        <Field label="Image URL" value={image} onChange={setImage} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  warn,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  warn?: boolean;
}) {
  return (
    <div>
      <label className="ws-label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ws-input"
        aria-invalid={warn || undefined}
      />
    </div>
  );
}
