"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { getStudioEnvironment } from "@/lib/three/studio";

export interface StudioRigProps {
  /** Deep background colour for the room. */
  bg: string;
  /** Spice accent; tints the fill light, the rim and the environment. */
  accent: string;
  /** Key light azimuth in radians. Varies per specimen so they don't all look alike. */
  lightAngle?: number;
  /** Y position of the ground plane the shadow falls on. */
  groundY?: number;
  /**
   * Contact shadows cost a depth render per frame. The hero wants one; a grid of
   * eleven tracked views does not.
   */
  contactShadow?: boolean;
}

/**
 * Lighting for a single specimen.
 *
 * Three sources do the work: a key from the environment (which supplies almost
 * all of the realism), a warm directional key that gives the surface a clear
 * direction, and an accent-coloured point light behind that produces the rim
 * separating the specimen from the background.
 */
export function StudioRig({
  bg,
  accent,
  lightAngle = 1,
  groundY = -0.62,
  contactShadow = true,
}: StudioRigProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const environment = getStudioEnvironment(gl, bg, accent);
    scene.environment = environment;
    return () => {
      scene.environment = null;
    };
  }, [gl, scene, bg, accent]);

  const keyX = Math.cos(lightAngle) * 2.4;
  const keyZ = Math.sin(lightAngle) * 2.4;
  const rimX = -Math.cos(lightAngle) * 1.9;
  const rimZ = -Math.sin(lightAngle) * 1.9;

  return (
    <>
      <ambientLight intensity={0.34} color={accent} />
      <directionalLight position={[keyX, 2.3, keyZ]} intensity={2.1} color="#fff5e7" />
      <pointLight
        position={[rimX, 0.95, rimZ]}
        intensity={3.4}
        color={accent}
        distance={9}
        decay={2}
      />
      {/* A dim bounce from below stops the underside collapsing to pure black. */}
      <directionalLight position={[0, -1.5, 1.1]} intensity={0.42} color={accent} />
      {contactShadow ? (
        <ContactShadows
          position={[0, groundY, 0]}
          opacity={0.62}
          scale={2.8}
          blur={2.6}
          far={2.4}
          resolution={512}
          color="#000000"
        />
      ) : null}
    </>
  );
}
