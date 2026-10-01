import localFont from "next/font/local";

/**
 * Self-hosted, from Fontshare (Indian Type Foundry).
 *
 * All Fontshare families are free for personal and commercial use and the ITF
 * Free Font License explicitly permits self-hosting. Licence text ships at
 * app/fonts/LICENSE-ITF-FFL.txt.
 *
 * Gambetta replaces a display serif that is one of the most recognisable AI
 * tells in production. Its calligraphic, slightly irregular serifs echo
 * hand-lettered spice-shop labels and wooden crate stamps, while its low
 * contrast keeps it legible at display size on a dark ground — which is exactly
 * the articulation a display serif needs to earn its place here.
 */

export const gambetta = localFont({
  src: [
    { path: "./gambetta-400.woff2", weight: "400", style: "normal" },
    { path: "./gambetta-500.woff2", weight: "500", style: "normal" },
    { path: "./gambetta-600.woff2", weight: "600", style: "normal" },
    { path: "./gambetta-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-gambetta",
  display: "swap",
  preload: true,
  fallback: ["ui-serif", "Georgia", "serif"],
});

export const satoshi = localFont({
  src: [
    { path: "./satoshi-400.woff2", weight: "400", style: "normal" },
    { path: "./satoshi-500.woff2", weight: "500", style: "normal" },
    { path: "./satoshi-700.woff2", weight: "700", style: "normal" },
    { path: "./satoshi-900.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
  preload: true,
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
