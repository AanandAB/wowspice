"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera, View } from "@react-three/drei";
import { Specimen } from "./specimen-mesh";
import { StudioRig } from "./studio-rig";
import { SPECIMEN_GL } from "@/lib/three/studio";
import { recipeFor, type SpecimenId } from "@/lib/three/recipes";
import { getSpiceById } from "@/data/spices";
import { formatINR } from "@/lib/commerce";

/**
 * Many specimens, one WebGL context.
 *
 * Eleven separate <Canvas> elements would exceed the browser's context budget
 * and duplicate all the GL state. drei's `View` draws each card's scene into a
 * scissored region of a single shared canvas instead, and every View gets its
 * own scene, camera and lights.
 *
 * The shared canvas mounts only once the grid is on screen, so a page does not
 * pay for eleven scenes before the user scrolls to them.
 */

interface SpecimenGridProps {
  ids: SpecimenId[];
  mapSize?: number;
  /** Adds the name, origin and price beneath each specimen. */
  captions?: boolean;
  /** Makes each cell a link to its product page. */
  linked?: boolean;
  className?: string;
}

export function SpecimenGrid({
  ids,
  // 320 (up from 256) keeps the valve/rib relief crisp on the dense card
  // renders without tripling the synthesis cost the way 384 would for eleven
  // simultaneous scenes.
  mapSize = 320,
  captions = true,
  linked = true,
  className = "",
}: SpecimenGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    // Without an observer there is nothing to wait for, so mount immediately
    // rather than leaving a page of blank cards.
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      // Pre-warm slightly ahead of the scroll so specimens are textured by the
      // time they are actually visible.
      { rootMargin: "260px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={rootRef}
        className={`relative z-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 ${className}`}
      >
        {ids.map((id) => {
          const spice = getSpiceById(id);
          const recipe = recipeFor(id);
          if (!spice) return null;

          const inner = (
            <>
              <View className="h-[124px] w-full max-w-[184px] sm:h-[158px]">
                <PerspectiveCamera
                  makeDefault
                  position={[0, 0.16, 3.15]}
                  fov={32}
                  near={0.1}
                  far={24}
                />
                <StudioRig
                  bg={spice.palette.bg}
                  accent={spice.palette.accent}
                  lightAngle={recipe.lightAngle}
                  contactShadow={false}
                />
                <Specimen spiceId={id} mapSize={mapSize} scale={1 / recipe.framing} />
              </View>

              {captions ? (
                <div className="mt-1 text-center">
                  <p className="text-[0.9rem] font-semibold">{spice.name}</p>
                  <p className="ws-meta mt-0.5 truncate">{spice.local.roman}</p>
                  <p className="ws-meta mt-1.5 tabular-nums">
                    {formatINR(spice.basePrice)}
                    <span className="opacity-60"> / 100 g</span>
                  </p>
                </div>
              ) : null}
            </>
          );

          return (
            <div key={id} className="flex flex-col items-center">
              {linked ? (
                <Link
                  href={`/spice/${spice.slug}`}
                  prefetch={false}
                  className="group flex w-full flex-col items-center rounded-[var(--radius-surface)] px-1 py-2 transition-colors duration-200 hover:bg-white/4"
                >
                  {inner}
                </Link>
              ) : (
                <div className="flex w-full flex-col items-center px-1 py-2">{inner}</div>
              )}
            </div>
          );
        })}
      </div>

      {active ? (
        <Canvas
          eventSource={rootRef as React.RefObject<HTMLElement>}
          // The overlay geometry has to go through `style`, not `className`.
          // R3F writes its own `position: relative; width/height: 100%` inline
          // style, and inline styles beat classes — so a Tailwind `fixed
          // inset-0` silently loses and the canvas collapses into the flow at
          // the bottom of the grid. `View` scissor-renders each specimen into
          // the region its tracked div occupies, so a canvas that is not the
          // full viewport maps every specimen off-screen.
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
          }}
          dpr={[1, 1.75]}
          gl={SPECIMEN_GL}
        >
          <View.Port />
        </Canvas>
      ) : null}
    </>
  );
}
