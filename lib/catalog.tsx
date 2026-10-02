"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API_BASE } from "./api";
import type { Spice } from "@/data/spices";

/**
 * Live catalogue overrides.
 *
 * The storefront ships with a static catalogue (data/spices.ts) for its rich
 * content, but prices, stock and images are owned by the CMS (D1). This provider
 * fetches GET /api/products once and exposes a slug -> product map so components
 * can overlay the CMS selling price and image on top of the static content.
 * While loading (or on a failed fetch) the map is empty and everything falls
 * back to the static values.
 */

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  sp: number;
  cp: number;
  stock_grams: number;
  sp_mode: string;
  image_url: string | null;
}

const CatalogContext = createContext<Map<string, CatalogProduct>>(new Map());

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, CatalogProduct>>(new Map());

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/products`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("catalog"))))
      .then((data: { products: CatalogProduct[] }) => {
        if (cancelled) return;
        const next = new Map<string, CatalogProduct>();
        for (const p of data.products) next.set(p.slug, p);
        setMap(next);
      })
      .catch(() => {
        if (!cancelled) setMap(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <CatalogContext.Provider value={map}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Map<string, CatalogProduct> {
  return useContext(CatalogContext);
}

/** The spice with its selling price overridden from the CMS when available. */
export function useResolvedSpice(spice: Spice): Spice {
  const map = useCatalog();
  const dyn = map.get(spice.slug);
  return dyn && Number.isFinite(Number(dyn.sp)) ? { ...spice, basePrice: Number(dyn.sp) } : spice;
}

/** CMS image URL for a slug, or undefined when not set / still loading. */
export function useCatalogImage(slug: string): string | null | undefined {
  const map = useCatalog();
  return map.get(slug)?.image_url;
}
