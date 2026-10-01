"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowsOutSimple, Cube } from "@phosphor-icons/react";
import { SpiceImage } from "./spice-image";
import type { Spice } from "@/data/spices";

type Mode = "whole" | "closeup";

const MODES: { id: Mode; label: string; icon: typeof Cube }[] = [
  { id: "whole", label: "Whole", icon: Cube },
  { id: "closeup", label: "Close-up", icon: ArrowsOutSimple },
];

/**
 * The product viewer, image edition.
 *
 * "Close-up" is not decoration: the whole argument for buying whole spice is
 * surface quality — the reticulation on a nutmeg, the ribs on a cardamom pod —
 * so the second view zooms the photo until that detail fills the frame. With a
 * single photo the zoom is a scale-into-centre crop; drop a dedicated macro
 * file and crossfade to it for a true second image.
 */
export function SpiceViewer({ spice }: { spice: Spice }) {
  const [mode, setMode] = useState<Mode>("whole");

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-media)] border border-white/10"
        style={{
          background: `radial-gradient(80% 70% at 50% 30%, ${spice.palette.accent}26 0%, transparent 72%)`,
        }}
      >
        <motion.div
          className="h-full w-full"
          animate={{ scale: mode === "closeup" ? 2.05 : 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <SpiceImage
            slug={spice.slug}
            name={spice.name}
            alt={spice.specimenDescription}
            priority
            className="h-full w-full"
          />
        </motion.div>

        <div
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1 rounded-[var(--radius-control)] border border-white/12 bg-black/40 p-1 backdrop-blur-sm"
          role="group"
          aria-label="Viewer zoom"
        >
          {MODES.map((option) => {
            const active = option.id === mode;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                aria-pressed={active}
                className="flex items-center gap-1.5 rounded-[var(--radius-control)] px-3 py-1.5 text-[0.78rem] font-medium transition-colors duration-200"
                style={{
                  background: active ? "rgb(var(--ws-accent))" : "transparent",
                  color: active ? "#100d0c" : "rgb(var(--ws-paper) / 0.78)",
                }}
              >
                <Icon size={13} weight="bold" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="ws-meta mt-5 max-w-[46ch] text-center leading-relaxed">
        {spice.specimenDescription}
      </p>
      <p className="ws-meta mt-1.5 text-center">Photographed whole — toggle for a closer look</p>
    </div>
  );
}
