"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderRecord } from "@/lib/commerce";

/**
 * Placed orders, kept in the browser only.
 *
 * There is no backend in this build, so the confirmation page reads from here.
 * When a real order API lands, this becomes the optimistic cache in front of it
 * and the lookup function keeps the same shape.
 */

interface OrdersState {
  orders: OrderRecord[];
  hydrated: boolean;
  placeOrder: (order: OrderRecord) => void;
  markHydrated: () => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      hydrated: false,
      placeOrder: (order) =>
        set((state) => ({ orders: [order, ...state.orders].slice(0, 20) })),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "wowspice.orders.v1",
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    }
  )
);

export function useOrder(id: string): {
  order: OrderRecord | undefined;
  hydrated: boolean;
} {
  const orders = useOrdersStore((state) => state.orders);
  const hydrated = useOrdersStore((state) => state.hydrated);
  return { order: orders.find((o) => o.id === id), hydrated };
}
