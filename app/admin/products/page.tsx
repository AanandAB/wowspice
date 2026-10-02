"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { adminFetch, adminToken, clearAdminToken } from "@/lib/admin";
import { paletteStyle, SPICES } from "@/data/spices";
import { BodyTheme } from "@/components/site/body-theme";

interface Product {
  id: string;
  slug: string;
  name: string;
  sp: number;
  cp: number;
  stock_grams: number;
  sp_mode: string;
  image_url: string | null;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken()) {
      router.push("/admin/login");
      return;
    }
    adminFetch<{ products: Product[] }>("/api/products")
      .then((d) => setProducts(d.products))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load products."));
  }, [router]);

  const save = async (product: Product, patch: Partial<Product>) => {
    setSaving(product.id);
    setError(null);
    try {
      await adminFetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setProducts((prev) => prev?.map((x) => (x.id === product.id ? { ...x, ...patch } : x)) ?? prev);
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
      <div className="relative z-10 mx-auto max-w-4xl px-5 pt-28 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="ws-display-lg">Products</h1>
          <div className="flex gap-2">
            <Link href="/admin/orders" className="ws-btn ws-btn-ghost ws-btn-sm">
              Orders
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

        <div className="mt-8 space-y-4">
          {products?.map((product) => (
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
  product: Product;
  saving: boolean;
  onSave: (p: Product, patch: Partial<Product>) => void;
}) {
  const [sp, setSp] = useState(String(product.sp));
  const [cp, setCp] = useState(String(product.cp));
  const [stock, setStock] = useState(String(product.stock_grams));
  const [image, setImage] = useState(product.image_url ?? "");

  const dirty =
    Number(sp) !== product.sp ||
    Number(cp) !== product.cp ||
    Number(stock) !== product.stock_grams ||
    image !== (product.image_url ?? "");

  return (
    <div className="rounded-[var(--radius-surface)] border border-white/10 bg-white/3 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{product.name}</p>
        <button
          disabled={saving || !dirty}
          onClick={() =>
            onSave(product, {
              sp: Number(sp),
              cp: Number(cp),
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
        <Field label="Selling price (₹/100g)" value={sp} onChange={setSp} />
        <Field label="Cost price (₹/100g)" value={cp} onChange={setCp} />
        <Field label="Stock (grams)" value={stock} onChange={setStock} />
        <Field label="Image URL" value={image} onChange={setImage} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="ws-label">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="ws-input" />
    </div>
  );
}
