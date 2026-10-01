"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { SPICES } from "@/data/spices";
import { formatINR } from "@/lib/commerce";
import { useUIStore } from "@/store/ui";

/**
 * Search across the catalogue.
 *
 * Opens with NO entrance animation on purpose: this is a keyboard-initiated
 * action that a frequent user hits dozens of times a day, and an animation would
 * make it feel slow and disconnected from the keystroke.
 */

interface Hit {
  slug: string;
  name: string;
  local: string;
  origin: string;
  price: number;
  accent: string;
}

/** Searchable text for one spice. Flavour notes and uses are included so a
 * shopper can search "smoky" or "fish curry" and land somewhere useful. */
function haystackFor(spice: (typeof SPICES)[number]): string {
  return [
    spice.name,
    spice.local.roman,
    spice.origin.place,
    spice.origin.district,
    spice.origin.state,
    spice.tagline,
    spice.harvest,
    ...spice.flavorNotes,
    ...spice.uses,
    ...spice.dietary,
    String(spice.heat),
  ]
    .join(" ")
    .toLowerCase();
}

function search(query: string): Hit[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return SPICES.filter((spice) => {
    if (terms.length === 0) return true;
    const haystack = haystackFor(spice);
    return terms.every((term) => haystack.includes(term));
  }).map((spice) => ({
    slug: spice.slug,
    name: spice.name,
    local: spice.local.roman,
    origin: `${spice.origin.place}, ${spice.origin.district}`,
    price: spice.basePrice,
    accent: spice.palette.accent,
  }));
}

export function CommandPalette() {
  const open = useUIStore((state) => state.paletteOpen);
  const close = useUIStore((state) => state.closePalette);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const hits = useMemo(() => search(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      restoreRef.current = document.activeElement as HTMLElement | null;
      inputRef.current?.focus();
      const { overflow } = document.body.style;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = overflow;
        restoreRef.current?.focus?.();
      };
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  if (!open) return null;

  const commit = (index: number) => {
    const hit = hits[index];
    if (!hit) return;
    close();
    router.push(`/spice/${hit.slug}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((current) => (hits.length ? (current + 1) % hits.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((current) => (hits.length ? (current - 1 + hits.length) % hits.length : 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      commit(selected);
      return;
    }
    if (event.key === "Tab") {
      // Keep focus inside the dialog while it is open.
      const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
        'input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[12vh]"
      onKeyDown={onKeyDown}
    >
      <div aria-hidden onClick={close} className="absolute inset-0 bg-black/66" />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search spices"
        className="relative w-full max-w-[560px] overflow-hidden rounded-[16px] border border-white/12 bg-[#141111] shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <MagnifyingGlass size={17} weight="bold" className="text-[rgb(var(--ws-paper)/0.5)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by spice, farm, flavour or use"
            className="h-14 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-[rgb(var(--ws-paper)/0.36)]"
            aria-label="Search spices"
            autoComplete="off"
          />
          <kbd className="font-mono text-[0.68rem] text-[rgb(var(--ws-paper)/0.36)]">esc</kbd>
        </div>

        <ul className="max-h-[52vh] overflow-y-auto overscroll-contain py-1.5" role="listbox">
          {hits.length === 0 ? (
            <li className="px-4 py-8 text-center">
              <p className="text-[0.9rem]">Nothing matches “{query}”.</p>
              <p className="ws-meta mt-1.5">
                Try a flavour instead: resinous, smoky, citrus, camphor.
              </p>
            </li>
          ) : (
            hits.map((hit, index) => (
              <li key={hit.slug} role="option" aria-selected={index === selected}>
                <button
                  type="button"
                  onMouseEnter={() => setSelected(index)}
                  onClick={() => commit(index)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                  style={{ background: index === selected ? "rgb(255 255 255 / 0.06)" : "transparent" }}
                >
                  <span
                    aria-hidden
                    className="h-3 w-3 flex-none rounded-full"
                    style={{
                      background: `radial-gradient(circle at 34% 30%, ${hit.accent} 0%, ${hit.accent}44 70%, transparent 100%)`,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9rem] font-medium">{hit.name}</span>
                    <span className="ws-meta block truncate">
                      {hit.local} · {hit.origin}
                    </span>
                  </span>
                  <span className="ws-meta flex-none tabular-nums">{formatINR(hit.price)}</span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
          <span className="ws-meta">
            {hits.length} of {SPICES.length}
          </span>
          <span className="ws-meta font-mono">↑↓ to move · ⏎ to open</span>
        </div>
      </div>
    </div>
  );
}
