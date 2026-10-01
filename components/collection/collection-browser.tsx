"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SPICES, paletteStyle, type Spice } from "@/data/spices";
import { formatINR, unitPrice } from "@/lib/commerce";
import { PACKS } from "@/data/spices";
import { SpiceGrid } from "@/components/spice/spice-grid";
import { BodyTheme } from "@/components/site/body-theme";

/**
 * The collection page, static-host edition.
 *
 * The original read filters from `searchParams` in a server component, which a
 * static export cannot do. This reads them client-side instead: each filter chip
 * is a plain <Link> to `/collection?…`, the static host serves `collection.html`
 * with the query intact, and `useSearchParams` applies the filter after load.
 */

const WHOLE = { id: "whole" as const, label: "Whole", note: "", surcharge: 0 };

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price, low to high" },
  { key: "price-desc", label: "Price, high to low" },
  { key: "name", label: "A–Z" },
];

function districts(): string[] {
  return [...new Set(SPICES.map((s) => s.origin.district))].sort();
}

function applyFilters(
  spices: Spice[],
  district: string | undefined,
  heat: string | undefined,
  sort: SortKey
): Spice[] {
  let result = [...spices];
  if (district) result = result.filter((s) => s.origin.district === district);
  if (heat === "none") result = result.filter((s) => s.heat === 0);
  else if (heat === "mild") result = result.filter((s) => s.heat === 1);
  else if (heat === "hot") result = result.filter((s) => s.heat >= 2);

  switch (sort) {
    case "price-asc":
      result.sort((a, b) => a.basePrice - b.basePrice);
      break;
    case "price-desc":
      result.sort((a, b) => b.basePrice - a.basePrice);
      break;
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      break;
  }
  return result;
}

function buildHref(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `/collection?${query}` : "/collection";
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className="rounded-[var(--radius-control)] border px-3.5 py-1.5 text-[0.8rem] whitespace-nowrap transition-colors duration-200"
      style={{
        background: active ? "var(--ws-paper)" : "transparent",
        color: active ? "#100d0c" : "rgb(var(--ws-paper) / 0.8)",
        borderColor: active ? "var(--ws-paper)" : "rgb(255 255 255 / 0.15)",
      }}
    >
      {children}
    </Link>
  );
}

export function CollectionBrowser() {
  return (
    <Suspense fallback={<div className="ws-skeleton mx-auto mt-28 h-[40vh] max-w-6xl" />}>
      <CollectionContent />
    </Suspense>
  );
}

function CollectionContent() {
  const searchParams = useSearchParams();
  const district = searchParams.get("district") ?? undefined;
  const heat = searchParams.get("heat") ?? undefined;
  const sortParam = searchParams.get("sort") ?? undefined;
  const sortKey = (SORTS.find((s) => s.key === sortParam)?.key ?? "featured") as SortKey;
  const results = applyFilters(SPICES, district, heat, sortKey);

  const cheapest = Math.min(...SPICES.map((spice) => unitPrice(spice, PACKS[0], WHOLE)));

  return (
    <div style={paletteStyle(SPICES[0])}>
      <BodyTheme accent={SPICES[0].palette.accent} bg={SPICES[0].palette.bg} />

      <div className="relative z-10 mx-auto max-w-6xl px-5 pt-28 pb-24 sm:px-8">
        <header className="max-w-[58ch]">
          <h1 className="ws-display-lg">The whole collection</h1>
          <p className="ws-body mt-4">
            Eleven spices from nine districts. Everything is sold whole as standard — grinding is
            done to order, the morning it ships. Prices start at {formatINR(cheapest)} per 100 g.
          </p>
        </header>

        <div className="mt-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ws-meta mr-1 w-16 shrink-0">District</span>
            <FilterChip
              href={buildHref({ heat, sort: sortKey !== "featured" ? sortKey : undefined })}
              active={!district}
            >
              All
            </FilterChip>
            {districts().map((name) => (
              <FilterChip
                key={name}
                href={buildHref({
                  district: name,
                  heat,
                  sort: sortKey !== "featured" ? sortKey : undefined,
                })}
                active={district === name}
              >
                {name}
              </FilterChip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="ws-meta mr-1 w-16 shrink-0">Heat</span>
            {[
              { key: undefined, label: "Any" },
              { key: "none", label: "None" },
              { key: "mild", label: "Mild" },
              { key: "hot", label: "Medium and up" },
            ].map((option) => (
              <FilterChip
                key={option.label}
                href={buildHref({
                  district,
                  heat: option.key,
                  sort: sortKey !== "featured" ? sortKey : undefined,
                })}
                active={(heat ?? undefined) === option.key}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="ws-meta mr-1 w-16 shrink-0">Sort</span>
            {SORTS.map((option) => (
              <FilterChip
                key={option.key}
                href={buildHref({
                  district,
                  heat,
                  sort: option.key !== "featured" ? option.key : undefined,
                })}
                active={sortKey === option.key}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <p className="ws-meta mt-8" aria-live="polite">
          {results.length} of {SPICES.length} spices
          {district ? ` from ${district}` : ""}
        </p>

        {results.length === 0 ? (
          <div className="ws-surface mt-8 px-6 py-14 text-center">
            <p className="font-display text-lg">Nothing matches those filters</p>
            <p className="ws-meta mx-auto mt-2 max-w-[38ch] leading-relaxed">
              We carry eleven spices from nine districts. Try widening the heat level, or browse
              everything.
            </p>
            <Link href="/collection" className="ws-btn ws-btn-ghost ws-btn-sm mt-6">
              Clear filters
            </Link>
          </div>
        ) : (
          <SpiceGrid ids={results.map((s) => s.id)} captions className="mt-6" />
        )}

        <section className="ws-rule mt-20 pt-10">
          <h2 className="ws-display-md">Not sure where to start?</h2>
          <p className="ws-body mt-3">
            Black pepper, turmeric and cardamom cover most everyday cooking. If you are cooking
            Kerala food specifically, add kudampuli — nothing else replicates that smoked sourness
            in a fish curry.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/spice/black-pepper" className="ws-btn ws-btn-ghost">
              Start with black pepper
            </Link>
            <Link href="/delivery" className="ws-btn ws-btn-ghost">
              Delivery and returns
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
