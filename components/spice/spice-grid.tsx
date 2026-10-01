"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { getSpiceById } from "@/data/spices";
import { formatINR } from "@/lib/commerce";
import { SpiceImage } from "./spice-image";
import type { SpecimenId } from "@/lib/three/recipes";

/**
 * The collection grid, image edition.
 *
 * Replaces the old WebGL `View`-scissored grid (eleven 3D scenes sharing one
 * canvas) with plain `<img>` cards. Each card fades/slides in on first scroll
 * and the photo zooms gently on hover. The card is a real product surface —
 * rounded `--radius-media` frame over a faint pool of the spice's accent.
 */

interface SpiceGridProps {
  ids: SpecimenId[];
  /** Adds the name, origin and price beneath each card. */
  captions?: boolean;
  /** Makes each card a link to its product page. */
  linked?: boolean;
  className?: string;
}

export function SpiceGrid({
  ids,
  captions = true,
  linked = true,
  className = "",
}: SpiceGridProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 ${className}`}
    >
      {ids.map((id) => {
        const spice = getSpiceById(id);
        if (!spice) return null;

        const media = (
          <div
            className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-media)] border border-white/10 bg-white/4"
            style={{
              background: `radial-gradient(80% 70% at 50% 32%, ${spice.palette.accent}26 0%, transparent 72%)`,
            }}
          >
            <SpiceImage
              slug={spice.slug}
              name={spice.name}
              alt={spice.specimenDescription}
              className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />
          </div>
        );

        const caption = captions ? (
          <div className="mt-2.5 text-center">
            <p className="text-[0.9rem] font-semibold">{spice.name}</p>
            <p className="ws-meta mt-0.5 truncate">{spice.local.roman}</p>
            <p className="ws-meta mt-1.5 tabular-nums">
              {formatINR(spice.basePrice)}
              <span className="opacity-60"> / 100 g</span>
            </p>
          </div>
        ) : null;

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -60px 0px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            {linked ? (
              <Link
                href={`/spice/${spice.slug}`}
                prefetch={false}
                className="group flex w-full flex-col items-center"
              >
                {media}
                {caption}
              </Link>
            ) : (
              <div className="flex w-full flex-col items-center">
                {media}
                {caption}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
