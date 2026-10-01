"use client";

import { useEffect } from "react";
import { accentTriplet } from "@/data/spices";

/**
 * Applies a spice palette to <body> so the fixed header and the footer inherit
 * the accent too, not just the page content between them.
 *
 * Page content should also be wrapped in a div carrying the same variables via
 * `paletteStyle`, so the first server-rendered paint is already correct and
 * this only matters for the chrome that lives outside the page tree.
 */
export function BodyTheme({ accent, bg }: { accent: string; bg: string }) {
  useEffect(() => {
    document.body.style.setProperty("--ws-accent", accentTriplet(accent));
    document.body.style.setProperty("--ws-bg", bg);
  }, [accent, bg]);

  return null;
}
