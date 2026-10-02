"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";
import { adminFetch, adminToken, clearAdminToken } from "@/lib/admin";
import { formatINR } from "@/lib/commerce";
import { paletteStyle, SPICES } from "@/data/spices";
import { BodyTheme } from "@/components/site/body-theme";

interface Report {
  orders_count: number;
  units_sold: number;
  subtotal: number;
  delivery: number;
  gst: number;
  revenue: number;
  cogs: number;
  gross_profit: number;
  expenses: number;
  net_profit: number;
  per_product: { slug: string; name: string; units: number; revenue: number; cogs: number; profit: number }[];
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    adminFetch<Report>("/api/admin/reports")
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."));
  }, []);

  useEffect(() => {
    if (!adminToken()) {
      router.push("/admin/login");
      return;
    }
    load();
  }, [router, load]);

  const signOut = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  const cards = report
    ? [
        { label: "Orders", value: String(report.orders_count) },
        { label: "Units sold", value: String(report.units_sold) },
        { label: "Revenue", value: formatINR(report.revenue) },
        { label: "COGS", value: formatINR(report.cogs) },
        { label: "Gross profit", value: formatINR(report.gross_profit) },
        { label: "Other expenses", value: formatINR(report.expenses) },
        { label: "Net profit", value: formatINR(report.net_profit), accent: true },
      ]
    : [];

  return (
    <div style={paletteStyle(SPICES[0])}>
      <BodyTheme accent={SPICES[0].palette.accent} bg={SPICES[0].palette.bg} />
      <div className="relative z-10 mx-auto max-w-4xl px-5 pt-28 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="ws-display-lg">Reports</h1>
          <div className="flex gap-2">
            <Link href="/admin/orders" className="ws-btn ws-btn-ghost ws-btn-sm">
              Orders
            </Link>
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

        {report ? (
          <>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {cards.map((c) => (
                <div
                  key={c.label}
                  className="rounded-[var(--radius-surface)] border p-4"
                  style={{
                    borderColor: c.accent ? "rgb(var(--ws-accent) / 0.5)" : "rgb(255 255 255 / 0.1)",
                    background: c.accent ? "rgb(var(--ws-accent) / 0.08)" : "rgb(255 255 255 / 0.03)",
                  }}
                >
                  <p className="ws-meta">{c.label}</p>
                  <p className="mt-1 text-[1.2rem] font-semibold tabular-nums">{c.value}</p>
                </div>
              ))}
            </div>

            <p className="ws-meta mt-4">
              Items {formatINR(report.subtotal)} · Delivery {formatINR(report.delivery)} · GST {formatINR(report.gst)}
            </p>

            <h2 className="ws-display-md mt-12">Per product</h2>
            <div className="mt-4 overflow-hidden rounded-[var(--radius-surface)] border border-white/10">
              <table className="w-full text-[0.86rem]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-[rgb(var(--ws-paper)/0.55)]">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 text-right font-medium">Units</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue</th>
                    <th className="px-4 py-3 text-right font-medium">COGS</th>
                    <th className="px-4 py-3 text-right font-medium">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {report.per_product.map((p) => (
                    <tr key={p.slug}>
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{p.units}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.revenue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.cogs)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatINR(p.profit)}</td>
                    </tr>
                  ))}
                  {report.per_product.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center ws-meta">
                        No sales yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : !error ? (
          <div className="ws-skeleton mt-8 h-48 w-full" />
        ) : null}
      </div>
    </div>
  );
}
