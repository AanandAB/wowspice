import * as THREE from "three";
import { clamp01, fbm2, lerp, ridged2, smoothstepRange, worley2 } from "./noise";
import type { MaterialRecipe, SurfaceFeature } from "./recipes";

/**
 * Procedural PBR map synthesis.
 *
 * One pass over a single height field produces everything: albedo, normal and
 * roughness are all derived from that field plus cheap per-pixel colour maths.
 * A naive implementation would re-evaluate the whole noise stack separately for
 * each map, roughly 4x the cost. Here the expensive part runs once.
 *
 * Ambient occlusion is baked into the albedo rather than shipped as a separate
 * `aoMap`. Three requires a dedicated UV channel for `aoMap`, and baking AO into
 * diffuse is visually equivalent for the low-frequency occlusion crevices
 * produce, without the UV-channel failure mode that silently does nothing.
 */

export interface SpecimenMaps {
  /** Albedo with baked ambient occlusion. sRGB. */
  map: THREE.CanvasTexture;
  /** Tangent-space normal map derived by Sobel over the height field. Linear. */
  normalMap: THREE.CanvasTexture;
  /** Roughness in the green channel is ignored; three reads .g. Linear. */
  roughnessMap: THREE.CanvasTexture;
  size: number;
  /** Milliseconds spent generating. Surfaced in the dev specimen lab. */
  buildMs: number;
  dispose: () => void;
}

/* -------------------------------------------------------------------------- */
/* Height field                                                               */
/* -------------------------------------------------------------------------- */

/** Wraps a noise sample so the texture tiles seamlessly across the UV seam. */
function tileFbm(u: number, v: number, freq: number, seed: number, octaves: number): number {
  // Sample on a torus: cheap, and it removes the visible seam at u=0/1 which
  // would otherwise run straight down every specimen.
  const a = u * Math.PI * 2;
  const b = v * Math.PI * 2;
  const r = freq / (Math.PI * 2);
  return fbm2(Math.cos(a) * r + 50, Math.sin(a) * r + Math.cos(b) * r + 50, seed, { octaves });
}

function featureHeight(u: number, v: number, f: SurfaceFeature, seed: number): number {
  const s = seed + f.kind.length * 977 + Math.round(f.scale * 31);
  switch (f.kind) {
    case "wrinkle": {
      // Warped ridges: the deep, irregular creases of a dried rind.
      const wx = tileFbm(u, v, 3.1, s + 11, 3);
      const wy = tileFbm(u, v, 3.1, s + 71, 3);
      return ridged2(
        u * f.scale + wx * (f.param ?? 0.4),
        v * f.scale + wy * (f.param ?? 0.4),
        s,
        { octaves: 4 }
      );
    }
    case "ribs": {
      // Longitudinal striations. UV.u runs around the circumference, so cosine
      // over u gives the count of ribs and a slow fbm breaks up their regularity.
      const wobble = tileFbm(u, v, 2.2, s + 3, 2) * (f.param ?? 0.35) * 0.12;
      return Math.cos((u + wobble) * Math.PI * 2 * f.scale);
    }
    case "striate": {
      // Bands running the other way (bark grain, fibre length).
      const wobble = tileFbm(u, v, 2.6, s + 5, 2) * (f.param ?? 0.3) * 0.1;
      return Math.cos((v + wobble) * Math.PI * 2 * f.scale);
    }
    case "reticulate": {
      // Voronoi cell borders -> the net pattern on a nutmeg.
      const { f1, f2 } = worley2(u * f.scale, v * f.scale, s);
      const border = clamp01((f2 - f1) / 0.42);
      return 1 - border * 2;
    }
    case "pebble": {
      // Rounded domes packed together (cashew shell, dried ginger skin).
      const { f1 } = worley2(u * f.scale, v * f.scale, s);
      return 1 - clamp01(f1 * 1.9) * 2;
    }
    case "speckle": {
      // Sparse pits. Density is driven by scale, size by param.
      const { f1 } = worley2(u * f.scale, v * f.scale, s);
      const radius = f.param ?? 0.3;
      return f1 < radius ? -1 : 0.15;
    }
    case "veins": {
      const wx = tileFbm(u, v, 4.4, s + 13, 3);
      const r = ridged2(u * f.scale + wx * 0.5, v * f.scale, s, { octaves: 3 });
      // Threshold to thin lines rather than broad ridges.
      return r > (f.param ?? 0.55) ? 1 : -0.25;
    }
    case "bloom": {
      // Soft mineral/sugar bloom patches sitting proud of the surface.
      return tileFbm(u, v, f.scale, s, 3) * (f.param ?? 1) * 0.6;
    }
    case "fibrous": {
      const stretch = f.param ?? 0.18;
      return ridged2(u * f.scale, v * f.scale * stretch, s, { octaves: 4 });
    }
    default:
      return 0;
  }
}

function heightAt(u: number, v: number, recipe: MaterialRecipe): number {
  let sum = 0;
  let weight = 0;
  for (const f of recipe.features) {
    sum += featureHeight(u, v, f, recipe.seed) * f.amp;
    weight += f.amp;
  }
  const h = weight > 0 ? sum / weight : 0;
  return clamp01(h * 0.5 + 0.5);
}

/**
 * Smooth 0..1 falloff around a v-band. A feature with a `region` keeps its full
 * tint strength at `base` and fades to nothing over roughly `falloff`.
 */
function regionMask(v: number, f: SurfaceFeature): number {
  const region = f.region;
  if (!region) return 1;
  const d = Math.abs(v - region.base) / Math.max(1e-4, region.falloff);
  const t = clamp01(1 - d);
  return t * t * (3 - 2 * t);
}

/**
 * Where a feature is raised, its `tint` blends into the albedo, weighted by the
 * same height field that drives the normal map. This is what makes colour track
 * topography — paler ribs, darker furrows — instead of the whole specimen
 * sitting in one flat shade of brown.
 *
 * The `third` colour is implicitly the deepest tint: it is applied last through
 * the crevice term, so tint blending only needs to handle raised features.
 */
function tintAt(
  u: number,
  v: number,
  recipe: MaterialRecipe
): { r: number; g: number; b: number; w: number } {
  let r = 0;
  let g = 0;
  let b = 0;
  let w = 0;
  for (const f of recipe.features) {
    if (!f.tint) continue;
    const mask = regionMask(v, f);
    if (mask <= 0) continue;
    // Raw feature response in [-1,1], before height normalisation: raised parts
    // of the feature (positive response) carry its tint; furrows do not.
    const response = featureHeight(u, v, f, recipe.seed);
    const raised = clamp01(response * 0.5 + 0.5) * mask;
    if (raised <= 0) continue;
    const tint = hexToRgb(f.tint);
    w += raised * f.amp;
    r += tint[0] * raised * f.amp;
    g += tint[1] * raised * f.amp;
    b += tint[2] * raised * f.amp;
  }
  return { r, g, b, w };
}

/* -------------------------------------------------------------------------- */
/* Colour helpers                                                             */
/* -------------------------------------------------------------------------- */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const n = parseInt(
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean,
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

/* -------------------------------------------------------------------------- */
/* Generator                                                                  */
/* -------------------------------------------------------------------------- */

export function generateSpecimenMaps(recipe: MaterialRecipe, size = 384): SpecimenMaps {
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();

  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      height[y * size + x] = heightAt(x / size, v, recipe);
    }
  }

  const base = hexToRgb(recipe.base);
  const second = hexToRgb(recipe.second);
  const third = hexToRgb(recipe.third);

  const albedoCanvas = makeCanvas(size);
  const roughCanvas = makeCanvas(size);
  const normalCanvas = makeCanvas(size);

  const albedoCtx = albedoCanvas.getContext("2d")!;
  const roughCtx = roughCanvas.getContext("2d")!;
  const normalCtx = normalCanvas.getContext("2d")!;

  const albedoData = albedoCtx.createImageData(size, size);
  const roughData = roughCtx.createImageData(size, size);
  const normalData = normalCtx.createImageData(size, size);

  const px = albedoData.data;
  const pr = roughData.data;
  const pn = normalData.data;

  // Normal strength is expressed per-pixel in height units; the recipe's
  // normalScale scales it so a single dial controls relief depth across spices.
  const nStrength = recipe.normalScale * 3.2;

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const o = i * 4;
      const u = x / size;
      const h = height[i];

      /* ---- albedo ---------------------------------------------------- */
      // Low-frequency mottling decides where the second tone shows through.
      const mottle = clamp01(tileFbm(u, v, 2.6, recipe.seed + 401, 3) * 0.5 + 0.5);
      const mottleMix = smoothstepRange(0.35, 0.8, mottle);

      // Crevices: inverted height, sharpened. This is the baked AO.
      const crevice = smoothstepRange(0.55, 0.15, h);
      const aoTerm = lerp(1, 0.42 + h * 0.58, recipe.aoStrength);

      let cr = lerp(base[0], second[0], mottleMix);
      let cg = lerp(base[1], second[1], mottleMix);
      let cb = lerp(base[2], second[2], mottleMix);

      // Raised-feature tints, weighted by their own strength: ribs take their
      // highlight colour, veins their thread colour, and so on.
      const tint = tintAt(u, v, recipe);
      if (tint.w > 0) {
        const tw = Math.min(1, tint.w * 1.35);
        cr = lerp(cr, tint.r / tint.w, tw);
        cg = lerp(cg, tint.g / tint.w, tw);
        cb = lerp(cb, tint.b / tint.w, tw);
      }

      cr = lerp(cr, third[0], crevice * 0.85);
      cg = lerp(cg, third[1], crevice * 0.85);
      cb = lerp(cb, third[2], crevice * 0.85);

      // Fine two-octave micro-grain. At this frequency the normal map cannot
      // usefully resolve it, but as albedo variation it is exactly the dusty,
      // slightly abrasive shimmer that separates a photographic surface from a
      // plastic-looking one.
      const grain = tileFbm(u, v, 90, recipe.seed + 907, 2) * 9;

      px[o] = (cr + grain) * aoTerm;
      px[o + 1] = (cg + grain) * aoTerm;
      px[o + 2] = (cb + grain) * aoTerm;
      px[o + 3] = 255;

      /* ---- roughness -------------------------------------------------- */
      // Oily patches (where the second tone pools) are smoother. This is the
      // dial that separates a glossy cardamom pod from chalky dried ginger.
      const oil = smoothstepRange(0.45, 0.95, mottle);
      const r = clamp01(
        recipe.roughness +
          (h - 0.5) * recipe.roughnessVariance -
          oil * recipe.oiliness
      );
      const rb = Math.round(clamp01(r) * 255);
      pr[o] = rb;
      pr[o + 1] = rb;
      pr[o + 2] = rb;
      pr[o + 3] = 255;

      /* ---- normal (Sobel over the height field) ----------------------- */
      const xm = x > 0 ? height[i - 1] : height[i + size - 1];
      const xp = x < size - 1 ? height[i + 1] : height[i - size + 1];
      const ym = y > 0 ? height[i - size] : height[(size - 1) * size + x];
      const yp = y < size - 1 ? height[i + size] : height[x];

      const dhdu = (xp - xm) * 0.5;
      // Canvas rows run opposite to texture V (flipY), so negate the V gradient.
      const dhdv = -(yp - ym) * 0.5;

      let nx = -dhdu * nStrength;
      let ny = -dhdv * nStrength;
      let nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len;
      ny /= len;
      nz /= len;

      pn[o] = (nx * 0.5 + 0.5) * 255;
      pn[o + 1] = (ny * 0.5 + 0.5) * 255;
      pn[o + 2] = (nz * 0.5 + 0.5) * 255;
      pn[o + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoData, 0, 0);
  roughCtx.putImageData(roughData, 0, 0);
  normalCtx.putImageData(normalData, 0, 0);

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.colorSpace = THREE.NoColorSpace;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.colorSpace = THREE.NoColorSpace;

  for (const tex of [map, normalMap, roughnessMap]) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
  }

  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    map,
    normalMap,
    roughnessMap,
    size,
    buildMs: Math.round(t1 - t0),
    dispose: () => {
      map.dispose();
      normalMap.dispose();
      roughnessMap.dispose();
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Cache + prefetch                                                           */
/* -------------------------------------------------------------------------- */

const CACHE_LIMIT = 8;
const cache = new Map<string, SpecimenMaps>();

function keyFor(recipe: MaterialRecipe, size: number): string {
  return `${recipe.seed}:${size}`;
}

/** Synchronous, memoised. Callers should usually prefetch first. */
export function getSpecimenMaps(recipe: MaterialRecipe, size = 384): SpecimenMaps {
  const key = keyFor(recipe, size);
  const hit = cache.get(key);
  if (hit) {
    // Refresh LRU position.
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }

  const maps = generateSpecimenMaps(recipe, size);

  if (cache.size >= CACHE_LIMIT) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.get(oldestKey)?.dispose();
      cache.delete(oldestKey);
    }
  }
  cache.set(key, maps);
  return maps;
}

/** Warm the cache without blocking. Safe to call repeatedly. */
export function prefetchSpecimenMaps(recipe: MaterialRecipe, size = 384): void {
  if (cache.has(keyFor(recipe, size))) return;
  const run = () => {
    if (!cache.has(keyFor(recipe, size))) getSpecimenMaps(recipe, size);
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(run, { timeout: 1500 });
  } else {
    setTimeout(run, 120);
  }
}

export function clearSpecimenMapCache(): void {
  for (const maps of cache.values()) maps.dispose();
  cache.clear();
}

/** Exposed for the dev specimen lab. */
export function specimenMapCacheSize(): number {
  return cache.size;
}
