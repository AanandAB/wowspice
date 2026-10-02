"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOut, Trash } from "@phosphor-icons/react";
import { adminFetch, adminToken, clearAdminToken } from "@/lib/admin";
import { formatINR } from "@/lib/commerce";
import { paletteStyle, SPICES } from "@/data/spices";
import { BodyTheme } from "@/components/site/body-theme";

interface Expense {
  id: string;
  category: string;
  amount: number;
  note: string | null;
  expense_date: number;
}

export default function AdminExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    adminFetch<{ expenses: Expense[] }>("/api/admin/expenses")
      .then((d) => setExpenses(d.expenses))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."));
  }, []);

  useEffect(() => {
    if (!adminToken()) {
      router.push("/admin/login");
      return;
    }
    load();
  }, [router, load]);

  const add = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/api/admin/expenses", {
        method: "POST",
        body: JSON.stringify({ category, amount: Number(amount), note: note || undefined }),
      });
      setCategory("");
      setAmount("");
      setNote("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await adminFetch(`/api/admin/expenses/${id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete.");
    }
  };

  const signOut = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  const total = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;

  return (
    <div style={paletteStyle(SPICES[0])}>
      <BodyTheme accent={SPICES[0].palette.accent} bg={SPICES[0].palette.bg} />
      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-28 pb-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="ws-display-lg">Expenses</h1>
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

        <p className="ws-meta mt-6">Total recorded: {formatINR(Math.round(total))}</p>

        {error ? (
          <p className="ws-error mt-4" role="alert">
            {error}
          </p>
        ) : null}

        <form onSubmit={add} className="mt-6 grid grid-cols-1 gap-3 rounded-[var(--radius-surface)] border border-white/10 bg-white/3 p-5 sm:grid-cols-[1fr_8rem_1fr_auto]">
          <input
            type="text"
            placeholder="Category (e.g. Rent, packing)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="ws-input"
            aria-label="Category"
          />
          <input
            type="number"
            placeholder="Amount ₹"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="ws-input"
            aria-label="Amount"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="ws-input"
            aria-label="Note"
          />
          <button type="submit" disabled={busy || !category.trim() || !Number(amount)} className="ws-btn ws-btn-accent">
            Add
          </button>
        </form>

        <ul className="mt-6 divide-y divide-white/8 border-y border-white/10">
          {expenses?.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-[0.9rem] font-medium">
                  {e.category} <span className="ws-meta ml-2">{formatINR(Number(e.amount))}</span>
                </p>
                {e.note ? <p className="ws-meta mt-0.5">{e.note}</p> : null}
              </div>
              <button
                onClick={() => remove(e.id)}
                className="ws-icon-btn !h-8 !w-8"
                aria-label={`Delete ${e.category}`}
              >
                <Trash size={14} weight="bold" />
              </button>
            </li>
          ))}
          {expenses !== null && expenses.length === 0 ? (
            <li className="py-6 text-center ws-meta">No expenses recorded yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
