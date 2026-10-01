"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/commerce";
import type { SpecimenId } from "@/lib/three/recipes";

/**
 * Cart state.
 *
 * Persisted to localStorage so a refresh does not lose a basket. `hydrated`
 * exists because the server has no access to localStorage: the header's item
 * count must not render until the client has rehydrated, or React reports a
 * hydration mismatch.
 */

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  /** Key of the most recently added line, for the "just added" highlight. */
  lastAddedKey: string | null;
  recentlyViewed: SpecimenId[];
  hydrated: boolean;

  addLine: (line: CartLine) => void;
  removeLine: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;

  openCart: () => void;
  closeCart: () => void;

  recordView: (id: SpecimenId) => void;
  markHydrated: () => void;
}

const MAX_RECENT = 4;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      lastAddedKey: null,
      recentlyViewed: [],
      hydrated: false,

      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find((l) => l.key === line.key);
          const lines = existing
            ? state.lines.map((l) =>
                l.key === line.key ? { ...l, quantity: l.quantity + line.quantity } : l
              )
            : [...state.lines, line];
          return { lines, lastAddedKey: line.key, isOpen: true };
        }),

      removeLine: (key) =>
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
        })),

      clear: () => set({ lines: [], lastAddedKey: null }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      recordView: (id) =>
        set((state) => ({
          recentlyViewed: [id, ...state.recentlyViewed.filter((x) => x !== id)].slice(0, MAX_RECENT),
        })),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "wowspice.cart.v1",
      // Transient UI state must not be persisted.
      partialize: (state) => ({
        lines: state.lines,
        recentlyViewed: state.recentlyViewed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);

/** Safe to call during render: false on the server and on the first paint. */
export function useCartHydrated(): boolean {
  return useCartStore((state) => state.hydrated);
}
