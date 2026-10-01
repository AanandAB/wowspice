"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Specimen } from "./specimen-mesh";
import { StudioRig } from "./studio-rig";
import { SPECIMEN_GL } from "@/lib/three/studio";
import { recipeFor, type SpecimenId } from "@/lib/three/recipes";
import { getSpiceById } from "@/data/spices";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

/**
 * The specimen stage.
 *
 * Transition model: one specimen is on screen at a time and the swap happens at
 * the moment the canvas is invisible, so no transparent-material sorting is
 * involved and the fade is a single composited CSS opacity on the canvas
 * element rather than a per-material alpha.
 *
 * Motion is spring-integrated and retargetable, so hammering the arrows
 * re-aims the transition in flight instead of queueing a backlog of keyframes.
 */

type Phase = "idle" | "out" | "in";

/** Exit is fast; entry is slower and settles. Asymmetric on purpose. */
const OUT_SECONDS = 0.2;
const IN_FADE_SECONDS = 0.26;
const IDLE_SPIN_RATE = 0.4;
const BOB_AMPLITUDE = 0.085;
/** How far the specimen travels, in radians, on exit and entry. */
const SWING = 2.0;
const SWING_X = 0.5;
const SWING_SCALE = 0.78;

interface AnimState {
  rot: number;
  rotVel: number;
  x: number;
  xVel: number;
  scale: number;
  scaleVel: number;
  opacity: number;
  phase: Phase;
  elapsed: number;
  dir: number;
  /** Rotation to reach at the end of the exit phase. */
  outRot: number;
}

function integrate(
  current: number,
  velocity: number,
  target: number,
  dt: number,
  stiffness: number,
  damping: number
): [number, number] {
  let v = velocity + (target - current) * stiffness * dt;
  // Exponential decay keeps the integration stable at any frame rate.
  v *= Math.exp(-damping * dt);
  return [current + v * dt, v];
}

/** Keeps a continuously-spinning angle bounded so transitions stay short. */
function wrapAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((((angle + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
}

interface AnimatedSpecimenProps {
  spiceId: SpecimenId;
  direction: number;
  mapSize: number;
  reduced: boolean;
  interactive: boolean;
  paused: boolean;
  /** Push-in factor. >1 zooms the specimen so surface detail fills the frame. */
  zoom: number;
}

function AnimatedSpecimen({
  spiceId,
  direction,
  mapSize,
  reduced,
  interactive,
  paused,
  zoom,
}: AnimatedSpecimenProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gl = useThree((state) => state.gl);
  const [displayId, setDisplayId] = useState<SpecimenId>(spiceId);
  const clockRef = useRef(0);
  const pendingRef = useRef<{ id: SpecimenId; dir: number }>({ id: spiceId, dir: direction });

  const anim = useRef<AnimState>({
    rot: 0,
    rotVel: 0,
    x: 0,
    xVel: 0,
    // Enter on first paint rather than appearing fully formed.
    scale: 0.92,
    scaleVel: 0,
    opacity: 0,
    phase: "in",
    elapsed: 0,
    dir: 1,
    outRot: 0,
  });

  useEffect(() => {
    pendingRef.current = { id: spiceId, dir: direction };
    if (spiceId === displayId) return;
    const a = anim.current;
    a.phase = "out";
    a.elapsed = 0;
    a.dir = direction;
    // Swing relative to wherever the idle spin currently is, so the object
    // always rolls in the direction the arrow implies.
    a.outRot = a.rot + SWING * direction;
  }, [spiceId, direction, displayId]);

  useEffect(() => {
    return () => {
      if (gl.domElement) gl.domElement.style.opacity = "";
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    if (!group) return;

    // A lost GPU context (driver reset, tab discard, Fast Refresh) leaves a
    // canvas that still ticks. Skip the work rather than throwing every frame.
    if (gl.getContext()?.isContextLost?.()) return;

    // Clamp dt so a backgrounded tab does not fling the springs on return.
    const dt = Math.min(rawDelta, 1 / 30);
    const a = anim.current;

    if (paused) {
      gl.domElement.style.opacity = String(a.opacity);
      return;
    }

    clockRef.current += dt;
    a.elapsed += dt;
    const dir = a.dir;

    if (a.phase === "out") {
      [a.rot, a.rotVel] = integrate(a.rot, a.rotVel, a.outRot, dt, 130, 14);
      if (!reduced) {
        [a.x, a.xVel] = integrate(a.x, a.xVel, -SWING_X * dir, dt, 130, 14);
        [a.scale, a.scaleVel] = integrate(a.scale, a.scaleVel, SWING_SCALE, dt, 130, 14);
      }
      a.opacity = Math.max(0, 1 - a.elapsed / OUT_SECONDS);

      if (a.elapsed >= OUT_SECONDS) {
        // Swap while invisible.
        setDisplayId(pendingRef.current.id);
        a.rot = -SWING * dir;
        a.rotVel = 0;
        a.x = SWING_X * dir;
        a.xVel = 0;
        a.scale = SWING_SCALE;
        a.scaleVel = 0;
        a.opacity = 0;
        a.phase = "in";
        a.elapsed = 0;
      }
    } else if (a.phase === "in") {
      [a.rot, a.rotVel] = integrate(a.rot, a.rotVel, 0, dt, 105, 12.5);
      [a.x, a.xVel] = integrate(a.x, a.xVel, 0, dt, 105, 12.5);
      [a.scale, a.scaleVel] = integrate(a.scale, a.scaleVel, 1, dt, 105, 12.5);
      a.opacity = Math.min(1, a.opacity + dt / IN_FADE_SECONDS);

      const settled =
        a.elapsed > 0.4 &&
        Math.abs(a.rot) < 0.014 &&
        Math.abs(a.rotVel) < 0.09 &&
        Math.abs(a.x) < 0.012 &&
        Math.abs(a.scale - 1) < 0.012;

      if (settled) {
        a.rot = 0;
        a.rotVel = 0;
        a.x = 0;
        a.xVel = 0;
        a.scale = 1;
        a.scaleVel = 0;
        a.opacity = 1;
        a.phase = "idle";
      }
    } else {
      // Idle: a slow turntable plus a gentle float.
      if (!reduced && !interactive) {
        a.rot = wrapAngle(a.rot + dt * IDLE_SPIN_RATE);
      }
      [a.x, a.xVel] = integrate(a.x, a.xVel, 0, dt, 105, 12.5);
      [a.scale, a.scaleVel] = integrate(a.scale, a.scaleVel, 1, dt, 105, 12.5);
      a.opacity = Math.min(1, a.opacity + dt / 0.2);
    }

    group.rotation.y = a.rot;
    group.position.x = a.x;
    group.position.y = reduced ? 0 : Math.sin(clockRef.current * 0.9) * BOB_AMPLITUDE;
    group.scale.setScalar(a.scale);

    // A single element, so this is one compositor-friendly property write and
    // not a style recalc across a subtree.
    gl.domElement.style.opacity = String(a.opacity);
  });

  const recipe = recipeFor(displayId);

  return (
    <group ref={groupRef}>
      <Specimen spiceId={displayId} mapSize={mapSize} scale={(1 / recipe.framing) * zoom} />
    </group>
  );
}

export interface SpecimenCanvasProps {
  spiceId: SpecimenId;
  /** +1 when moving to the next spice, -1 for previous. */
  direction?: number;
  /** Texture resolution. Cards can afford less than the hero. */
  mapSize?: number;
  /** Enables drag-to-orbit and disables the idle spin. */
  interactive?: boolean;
  paused?: boolean;
  /** Push-in factor for macro viewing. */
  zoom?: number;
  className?: string;
}

export function SpecimenCanvas({
  spiceId,
  direction = 1,
  mapSize = 384,
  interactive = false,
  paused = false,
  zoom = 1,
  className,
}: SpecimenCanvasProps) {
  const spice = getSpiceById(spiceId);
  const recipe = recipeFor(spiceId);
  const reduced = usePrefersReducedMotion();

  const bg = spice?.palette.bg ?? "#100d0c";
  const accent = spice?.palette.accent ?? "#d9722c";

  // The camera stays put across transitions; per-spice framing is applied by
  // scaling the specimen instead, which avoids a camera jump at the midpoint.
  const cameraZ = 3.15;

  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      camera={{ position: [0, 0.16, cameraZ], fov: 32, near: 0.1, far: 24 }}
      gl={SPECIMEN_GL}
    >
      <StudioRig bg={bg} accent={accent} lightAngle={recipe.lightAngle} />
      <AnimatedSpecimen
        spiceId={spiceId}
        direction={direction}
        mapSize={mapSize}
        reduced={reduced}
        interactive={interactive}
        paused={paused}
        zoom={zoom}
      />
      {interactive ? (
        <OrbitControls
          enablePan={false}
          minDistance={cameraZ * 0.55}
          maxDistance={cameraZ * 1.45}
          minPolarAngle={0.4}
          maxPolarAngle={Math.PI - 0.4}
          autoRotate={!reduced}
          autoRotateSpeed={0.5}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.7}
        />
      ) : null}
    </Canvas>
  );
}
