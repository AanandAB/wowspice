"use client";

import { create } from "zustand";

/**
 * Cross-component UI state.
 *
 * The header and the command palette are siblings, so a store avoids threading
 * callbacks through the layout.
 */
interface UIState {
  paletteOpen: boolean;
  menuOpen: boolean;
  openPalette: () => void;
  togglePalette: () => void;
  closePalette: () => void;
  setMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  paletteOpen: false,
  menuOpen: false,
  openPalette: () => set({ paletteOpen: true }),
  togglePalette: () => set((state) => ({ paletteOpen: !state.paletteOpen })),
  closePalette: () => set({ paletteOpen: false }),
  setMenuOpen: (open) => set({ menuOpen: open }),
}));
