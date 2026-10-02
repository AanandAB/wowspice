"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { PACKS, SPICES, accentTriplet, backdrop, neighbourSpice } from "@/data/spices";
import { formatINR, unitPrice } from "@/lib/commerce";
import { useCartStore } from "@/store/cart";
import { SpiceImage } from "@/components/spice/spice-image";
import { spiceImage } from "@/data/photography";
import { useResolvedSpice } from "@/lib/catalog";

/** Ignore a tap that was really the tail of a horizontal drag. */
const DRAG_CLICK_THRESHOLD = 8;
/** px/ms above which a flick advances regardless of distance. */
const FLICK_VELOCITY = 0.11;
/**
 * Minimum travel before a gesture may count as a flick.
 *
 * Without this, a tap that jitters two pixels in under a millisecond divides out
 * to a huge velocity and gets read as a hard flick — which is exactly what touch
 * input produces. Every tap would move the carousel.
 */
const FLICK_MIN_DISTANCE = 18;
const DRAG_DISTANCE = 56;

const WHOLE = { id: "whole" as const, label: "Whole", note: "", surcharge: 0 };

interface NavState {
  index: number;
  /** +1 for next, -1 for previous. Drives which way the stage rolls. */
  direction: number;
  /**
   * Monotonic navigation counter. The crossfade needs a layer that alternates
   * on every move; deriving it from the index breaks on wrap-around, where
   * consecutive indices can land on the same parity.
   */
  count: number;
}

export function SpiceCarousel() {
  const [nav, setNav] = useState<NavState>({ index: 0, direction: 1, count: 0 });
  const spice = SPICES[nav.index];
  const resolvedSpice = useResolvedSpice(spice);
  const layer = nav.count % 2;
  const router = useRouter();
  const recordView = useCartStore((state) => state.recordView);

  const [backdrops, setBackdrops] = useState<[string, string]>(() => {
    const initial = backdrop(SPICES[0]);
    return [initial, initial];
  });

  const drag = useRef<{ x: number; y: number; time: number } | null>(null);
  const suppressClick = useRef(false);

  const go = useCallback((delta: number) => {
    if (delta === 0) return;
    setNav((current) => ({
      index: (current.index + delta + SPICES.length) % SPICES.length,
      direction: delta > 0 ? 1 : -1,
      count: current.count + 1,
    }));
  }, []);

  const goToIndex = useCallback((target: number) => {
    setNav((current) => {
      if (target === current.index) return current;
      const forward = (target - current.index + SPICES.length) % SPICES.length;
      return {
        index: target,
        direction: forward <= SPICES.length / 2 ? 1 : -1,
        count: current.count + 1,
      };
    });
  }, []);

  /* Crossfade the backdrop layer and re-skin the page chrome. */
  useEffect(() => {
    const target = nav.count % 2;
    const gradient = backdrop(spice);
    setBackdrops((prev) => {
      const copy: [string, string] = [prev[0], prev[1]];
      copy[target] = gradient;
      return copy;
    });

    // Written once per navigation, not per frame. Scoping these to <body> is
    // what lets the header and footer inherit the spice accent too.
    document.body.style.setProperty("--ws-accent", accentTriplet(spice.palette.accent));
    document.body.style.setProperty("--ws-bg", spice.palette.bg);
  }, [spice, nav.count]);

  useEffect(() => {
    recordView(spice.id);
    // Warm the neighbours so the next arrow press has its photo decoded.
    for (const offset of [1, -1]) {
      const src = spiceImage(neighbourSpice(spice.id, offset).slug);
      if (src) new Image().src = src;
    }
  }, [spice.id, recordView]);

  /* Arrow keys are a first-class way to browse. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        go(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go]);

  const packPreview = useMemo(
    () =>
      [PACKS[1], PACKS[3]].map((pack) => ({
        label: pack.label,
        price: unitPrice(resolvedSpice, pack, WHOLE),
      })),
    [resolvedSpice]
  );

  const openDetail = useCallback(() => {
    router.push(`/spice/${spice.slug}`);
  }, [router, spice.slug]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, time: performance.now() };
    suppressClick.current = false;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture can fail for a synthetic or already-released pointer. The drag
      // still works from the element's own move events, so this is not fatal.
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Claim clearly horizontal gestures only, so vertical scroll still works.
    if (Math.abs(dx) > DRAG_CLICK_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      suppressClick.current = true;
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    // Must be a predominantly horizontal gesture, and must have actually moved.
    if (Math.abs(dx) <= Math.abs(dy)) return;
    if (Math.abs(dx) < DRAG_CLICK_THRESHOLD) return;

    const elapsed = Math.max(1, performance.now() - start.time);
    const velocity = Math.abs(dx) / elapsed;
    const isFlick = Math.abs(dx) >= FLICK_MIN_DISTANCE && velocity > FLICK_VELOCITY;

    if (Math.abs(dx) >= DRAG_DISTANCE || isFlick) {
      go(dx < 0 ? 1 : -1);
    }
  };

  const onStageClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    openDetail();
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Spice collection"
      className="ws-grain relative z-10 flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 pt-28 pb-16 sm:px-8"
    >
      {[0, 1].map((index) => (
        <div
          key={index}
          aria-hidden
          className="ws-bg-layer"
          style={{ background: backdrops[index], opacity: layer === index ? 1 : 0 }}
        />
      ))}

      <div className="relative flex w-full max-w-6xl flex-col items-center">
        <p className="ws-meta mb-6 tabular-nums" aria-live="polite">
          <span className="ws-accent-text font-semibold">
            {String(nav.index + 1).padStart(2, "0")}
          </span>
          <span aria-hidden> / </span>
          {String(SPICES.length).padStart(2, "0")}
          <span className="sr-only"> — {spice.name}</span>
        </p>

        <div className="grid w-full grid-cols-1 items-center justify-items-center gap-8 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-10">
          <button
            type="button"
            onClick={() => go(-1)}
            className="ws-icon-btn order-2 hidden sm:order-none sm:flex"
            aria-label="Previous spice"
          >
            <ArrowLeft size={18} weight="bold" />
          </button>

          <div className="order-1 flex w-full flex-col items-center sm:order-none">
            <div
              role="button"
              tabIndex={0}
              aria-label={`View ${spice.name} in detail`}
              onClick={onStageClick}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openDetail();
                }
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                drag.current = null;
              }}
              className="relative aspect-[4/5] w-full max-w-[320px] cursor-pointer touch-pan-y select-none overflow-hidden rounded-[var(--radius-media)] border border-white/10"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* The photo card: slides in from the direction you navigated and
                  the outgoing one fades/shrinks beneath it. */}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={spice.id}
                  initial={{ opacity: 0, x: 60 * nav.direction, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <SpiceImage
                    slug={spice.slug}
                    name={spice.name}
                    alt={spice.specimenDescription}
                    priority
                    className="h-full w-full"
                  />
                </motion.div>
              </AnimatePresence>
              {/* Hairline ring so the photo reads as a card, not a bare crop. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[var(--radius-media)] ring-1 ring-inset ring-white/10"
              />
            </div>

            <div className="mt-2 flex items-center gap-4 sm:hidden">
              <button
                type="button"
                onClick={() => go(-1)}
                className="ws-icon-btn"
                aria-label="Previous spice"
              >
                <ArrowLeft size={18} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="ws-icon-btn"
                aria-label="Next spice"
              >
                <ArrowRight size={18} weight="bold" />
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <h1 className="ws-display-xl">{spice.name}</h1>
              <p className="ws-local mt-2">{spice.local.roman}</p>
              <p className="ws-body mt-4 text-center text-[0.98rem]">{spice.tagline}</p>

              <div className="mt-6 flex items-baseline gap-3">
                <span className="ws-price">{formatINR(resolvedSpice.basePrice)}</span>
                <span className="ws-meta">per 100 g</span>
              </div>
              <p className="ws-meta mt-2 tabular-nums">
                {packPreview
                  .map((pack) => `${pack.label} ${formatINR(pack.price)}`)
                  .join("  ·  ")}
              </p>

              <Link
                href={`/spice/${spice.slug}`}
                className="ws-btn ws-btn-ghost mt-7"
                prefetch={false}
              >
                View spice &amp; order
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-1" aria-label="Choose a spice">
              {SPICES.map((item, dotIndex) => {
                const active = dotIndex === nav.index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToIndex(dotIndex)}
                    aria-label={`Show ${item.name}`}
                    aria-current={active}
                    className="flex h-6 cursor-pointer items-center px-1"
                  >
                    <span
                      className="block h-1.5 rounded-full transition-[width,background-color] duration-300"
                      style={{
                        width: active ? 22 : 6,
                        backgroundColor: active
                          ? "rgb(var(--ws-accent))"
                          : "rgb(255 255 255 / 0.26)",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => go(1)}
            className="ws-icon-btn order-3 hidden sm:order-none sm:flex"
            aria-label="Next spice"
          >
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>

        <p className="ws-meta mt-10 text-center">
          Tap the spice, use the arrows, or swipe. Arrow keys work too.
        </p>
      </div>
    </section>
  );
}
