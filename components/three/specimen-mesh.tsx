"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { buildSpecimenGeometry } from "@/lib/three/geometry/specimens";
import { getSpecimenMaps } from "@/lib/three/proceduralTextures";
import { MODEL_OVERRIDES, recipeFor, type SpecimenId } from "@/lib/three/recipes";
import { useLoader } from "@react-three/fiber";

/**
 * Builds one specimen's geometry and material.
 *
 * Geometry and maps are both memoised per spice, and the generated texture maps
 * live in a module-level LRU (see proceduralTextures) rather than being disposed
 * with the component — they are expensive to rebuild and get reused the moment
 * the carousel cycles back around.
 */

export interface SpecimenProps {
  spiceId: SpecimenId;
  /** Map resolution. Cards use less than the hero. */
  mapSize?: number;
  /** Render order hint for the grid. */
  position?: [number, number, number];
  scale?: number;
}

/**
 * Loads a dropped-in real scan when one exists.
 *
 * `MODEL_OVERRIDES` is empty out of the box: there is no free CC0 library of
 * spice specimens, so every spice ships procedural. Adding one line there swaps
 * a spice over with no other changes.
 */
function OverriddenModel({ url, scale = 1 }: { url: string; scale?: number }) {
  const gltf = useLoader(GLTFLoader, url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf]);

  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const material = mesh.material as THREE.MeshStandardMaterial;
        if (material) {
          material.envMapIntensity = 0.9;
          material.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} scale={scale} />;
}

export function Specimen({
  spiceId,
  mapSize = 384,
  position = [0, 0, 0],
  scale = 1,
}: SpecimenProps) {
  const recipe = useMemo(() => recipeFor(spiceId), [spiceId]);
  const overrideUrl = MODEL_OVERRIDES[spiceId];

  const geometry = useMemo(() => {
    if (overrideUrl) return null;
    return buildSpecimenGeometry(recipe.geometry);
    // recipe is derived from spiceId, so spiceId alone is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spiceId, overrideUrl]);

  const maps = useMemo(() => {
    if (overrideUrl) return null;
    return getSpecimenMaps(recipe.material, mapSize);
  }, [overrideUrl, recipe, mapSize]);

  const material = useMemo(() => {
    if (!maps) return null;
    const m = new THREE.MeshPhysicalMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      roughnessMap: maps.roughnessMap,
      // Relief strength is already baked into the generated normal map, so this
      // stays at 1. Multiplying again would double the depth.
      normalScale: new THREE.Vector2(1, 1),
      metalness: 0,
      // Multiplied by roughnessMap, so 1 lets the map lead.
      roughness: 1,
      envMapIntensity: 1.25,
      // Fabric-like back-scatter for dusty surfaces, from the recipe. Kept
      // small in the recipes; 0 for waxy spices leaves the default behaviour.
      sheen: recipe.material.sheen ?? 0,
      sheenRoughness: 0.75,
      sheenColor: new THREE.Color("#fff2e0"),
    });
    if (recipe.material.clearcoat) {
      m.clearcoat = recipe.material.clearcoat;
      m.clearcoatRoughness = recipe.material.clearcoatRoughness ?? 0.4;
    }
    return m;
  }, [maps, recipe]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  if (overrideUrl) {
    return (
      <group position={position} scale={scale}>
        <OverriddenModel url={overrideUrl} />
      </group>
    );
  }

  if (!geometry || !material) return null;

  return (
    <group position={position} scale={scale}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
