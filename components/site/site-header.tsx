"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List, MagnifyingGlass, ShoppingBag, X } from "@phosphor-icons/react";
import { Wordmark } from "./wordmark";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { cartItemCount } from "@/lib/commerce";

const NAV = [
  { label: "Shop", href: "/collection" },
  { label: "Our farms", href: "/farms" },
  { label: "Delivery", href: "/delivery" },
  { label: "Wholesale", href: "/wholesale" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const lines = useCartStore((state) => state.lines);
  const hydrated = useCartStore((state) => state.hydrated);
  const openCart = useCartStore((state) => state.openCart);
  const openPalette = useUIStore((state) => state.openPalette);
  const menuOpen = useUIStore((state) => state.menuOpen);
  const setMenuOpen = useUIStore((state) => state.setMenuOpen);

  const count = hydrated ? cartItemCount(lines) : 0;
  const [pulse, setPulse] = useState(false);
  const previousCount = useRef(count);

  useEffect(() => {
    if (count !== previousCount.current && count > 0) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 340);
      previousCount.current = count;
      return () => clearTimeout(timer);
    }
    previousCount.current = count;
  }, [count]);

  // Close the mobile menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  // The palette shortcut. Keyboard-initiated, so it opens with no animation.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        useUIStore.getState().togglePalette();
      }
      // Some layouts use "/" as a search accelerator; keep it available here.
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
        event.preventDefault();
        useUIStore.getState().openPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-b from-black/72 to-transparent backdrop-blur-[2px]" />
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:h-[72px] sm:px-8">
        <Wordmark />

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="text-[0.9rem] whitespace-nowrap transition-colors duration-200"
                    style={{
                      color: active
                        ? "rgb(var(--ws-paper))"
                        : "rgb(var(--ws-paper) / 0.76)",
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={openPalette}
            className="hidden h-10 items-center gap-2 rounded-full border border-white/14 bg-white/4 px-3.5 text-[0.8rem] text-[rgb(var(--ws-paper)/0.62)] transition-colors duration-200 hover:border-white/30 hover:text-[rgb(var(--ws-paper))] sm:flex"
            aria-label="Search spices"
          >
            <MagnifyingGlass size={15} weight="bold" />
            <span>Search</span>
            <kbd className="font-mono text-[0.68rem] text-[rgb(var(--ws-paper)/0.4)]">⌘K</kbd>
          </button>

          <button
            type="button"
            onClick={openPalette}
            className="ws-icon-btn sm:hidden"
            aria-label="Search spices"
          >
            <MagnifyingGlass size={18} weight="bold" />
          </button>

          <button
            type="button"
            onClick={openCart}
            className="ws-icon-btn relative"
            aria-label={count > 0 ? `Cart, ${count} items` : "Cart, empty"}
          >
            <ShoppingBag size={18} weight="bold" />
            {count > 0 ? (
              <span
                className={`absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[0.68rem] font-bold tabular-nums text-[#100d0c] ${
                  pulse ? "ws-pop" : ""
                }`}
                style={{ backgroundColor: "rgb(var(--ws-accent))" }}
                aria-hidden
              >
                {count}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="ws-icon-btn lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile menu: occasional, so a short standard animation is right. */}
      <div
        className="relative overflow-hidden border-t border-white/8 bg-[#0b0908]/96 backdrop-blur-md transition-[max-height,opacity] duration-200 ease-out lg:hidden"
        style={{
          maxHeight: menuOpen ? 320 : 0,
          opacity: menuOpen ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Mobile" className="px-5 py-3 sm:px-8">
          <ul className="divide-y divide-white/8">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  tabIndex={menuOpen ? 0 : -1}
                  className="block py-3.5 text-[0.95rem] text-[rgb(var(--ws-paper)/0.85)]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
