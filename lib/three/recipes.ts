/**
 * Per-spice specimen recipes.
 *
 * `material` colours are deliberately *naturalistic* rather than matching the
 * UI accent. The accent is a vibrancy boost applied to lighting and chrome; the
 * object itself has to look like the real dried thing or the whole exercise
 * reads as a cartoon.
 *
 * Every recipe is fully deterministic: same seed, same geometry, same maps.
 */

export type FeatureKind =
  | "wrinkle"
  | "ribs"
  | "striate"
  | "reticulate"
  | "pebble"
  | "speckle"
  | "veins"
  | "bloom"
  | "fibrous";

export interface SurfaceFeature {
  kind: FeatureKind;
  /** Frequency / rib count / cell density, depending on kind. */
  scale: number;
  /** Contribution to the height field, 0..1. */
  amp: number;
  /** Secondary parameter: warp amount, speckle radius, fibre stretch. */
  param?: number;
  /**
   * Where this feature sits on the body, 0..1 in UV.v (0 = one pole, 1 = the
   * other; ~0.5 = the equator). Poles are the low-v end of the canvas.
   *
   * `base` anchors the region and `falloff` is roughly its half-width; the tint
   * fades out over that distance. Geometric displacement intentionally ignores
   * this — bands are a *colour* feature — but the height channel still sees the
   * tinted amplitude so the surface texture itself also calms down off-region.
   */
  region?: {
    /** Centre of the band in v. */
    base: number;
    /** Rough half-width of the band in v. */
    falloff: number;
  };
  /**
   * Albedo tint: hex colour this feature blends toward where it is raised.
   * This is what stops the whole specimen reading as one flat shade of brown —
   * real dried spice colour variation *tracks* its topography (a cardamom's
   * ribs are paler than the furrows between them; a cinnamon quill's ridges
   * sit between the red-brown bark and the darker fissures).
   */
  tint?: string;
}

export interface MaterialRecipe {
  seed: number;
  base: string;
  second: string;
  third: string;
  /** Base roughness 0..1. */
  roughness: number;
  roughnessVariance: number;
  /** How much oilier patches drop the roughness (waxy vs chalky). */
  oiliness: number;
  /** Normal map relief depth. */
  normalScale: number;
  /** Baked occlusion strength, 0..1. */
  aoStrength: number;
  /**
   * Fabric-like back-scatter for dusty, chalky surfaces (dried ginger skin,
   * kudampuli's matte rind). Zero for waxy ones like cardamom. Kept small —
   * past ~0.35 everything starts looking like velvet upholstery.
   */
  sheen?: number;
  /** Optional clearcoat for genuinely glossy surfaces. */
  clearcoat?: number;
  clearcoatRoughness?: number;
  features: SurfaceFeature[];
}

export type GeometryKind =
  | "peppercorn"
  | "spindlePod"
  | "rolledQuill"
  | "rhizome"
  | "nutmegOvoid"
  | "maceAril"
  | "reniformShell"
  | "kernel"
  | "gingerRoot"
  | "longPod"
  | "wrinkledRind";

export interface GeometrySpec {
  kind: GeometryKind;
  /** Subdivision / resolution of the base surface. */
  detail: number;
  /** Vertex displacement amplitude in local units. */
  displacement: number;
  /** Specimen copies, arranged as a small cluster. */
  copies?: number;
  /**
   * Cluster spread. Wider bodies need more room between copies or the cluster
   * fuses into a single blob — a cashew kernel is much fatter than a cardamom
   * pod, so it clusters looser.
   */
  spread?: number;
  seed: number;
}

export interface SpecimenRecipe {
  material: MaterialRecipe;
  geometry: GeometrySpec;
  /** Multiplier on the framing distance. >1 pulls the camera back. */
  framing: number;
  /** Which way the rim light comes from, in radians. */
  lightAngle: number;
  /**
   * Static body-orientation nudges, radians, applied once at build time.
   *
   * Builders have always twisted finished geometry with rotateX/rotateZ to
   * hide pole artefacts or show a spiral cross-section; some of those turns
   * were reaching further than the builder could justify, so they now live
   * here — next to the framing they exist to serve — as a per-recipe
   * `postRotate: [x, y, z]` applied in the pipeline *after* the last
   * bounding-sphere fit, so it can tilt a silhouette without changing scale.
   */
  postRotate?: [number, number, number];
}

export const SPECIMEN_RECIPES = {
  pepper: {
    framing: 1,
    lightAngle: 0.9,
    material: {
      seed: 1001,
      base: "#5c4a3a",
      second: "#8a715a",
      third: "#241b14",
      roughness: 0.55,
      roughnessVariance: 0.34,
      oiliness: 0.24,
      normalScale: 1.0,
      aoStrength: 0.62,
      sheen: 0.12,
      features: [
        { kind: "wrinkle", scale: 9, amp: 0.55, param: 0.55, tint: "#3d2e22" },
        { kind: "speckle", scale: 26, amp: 0.25, param: 0.2, tint: "#191008" },
        { kind: "pebble", scale: 40, amp: 0.2, tint: "#4a3a2d" },
      ],
    },
    geometry: { kind: "peppercorn", detail: 5, displacement: 0.075, copies: 1, seed: 1001 },
  },

  cardamom: {
    framing: 1.05,
    lightAngle: 1.5,
    material: {
      seed: 2002,
      base: "#7f9a5b",
      second: "#b2c788",
      third: "#31411f",
      roughness: 0.36,
      roughnessVariance: 0.22,
      oiliness: 0.32,
      normalScale: 0.85,
      aoStrength: 0.6,
      clearcoat: 0.22,
      clearcoatRoughness: 0.5,
      features: [
        { kind: "ribs", scale: 18, amp: 0.7, param: 0.3, tint: "#c3d698" },
        { kind: "striate", scale: 60, amp: 0.2, tint: "#4e6a30" },
        {
          kind: "bloom",
          scale: 4,
          amp: 0.18,
          tint: "#a3b877",
          region: { base: 0.85, falloff: 0.55 },
        },
      ],
    },
    geometry: { kind: "spindlePod", detail: 5, displacement: 0.02, copies: 3, seed: 2002 },
  },

  cinnamon: {
    framing: 1.15,
    lightAngle: 0.6,
    material: {
      seed: 3003,
      base: "#8a5432",
      second: "#b98a54",
      third: "#301c10",
      roughness: 0.74,
      roughnessVariance: 0.28,
      oiliness: 0.12,
      normalScale: 1.1,
      aoStrength: 0.7,
      sheen: 0.14,
      features: [
        { kind: "striate", scale: 45, amp: 0.5, param: 0.5, tint: "#c99a63" },
        { kind: "fibrous", scale: 22, amp: 0.35, param: 0.12, tint: "#a97744" },
        { kind: "speckle", scale: 18, amp: 0.15, param: 0.22, tint: "#6b4222" },
      ],
    },
    geometry: { kind: "rolledQuill", detail: 3, displacement: 0.012, copies: 1, seed: 3003 },
  },

  turmeric: {
    framing: 1.15,
    lightAngle: 1.1,
    material: {
      seed: 4004,
      base: "#b06f16",
      second: "#e09a2a",
      third: "#6b3d08",
      roughness: 0.5,
      roughnessVariance: 0.3,
      oiliness: 0.22,
      normalScale: 1.0,
      aoStrength: 0.68,
      sheen: 0.1,
      features: [
        { kind: "wrinkle", scale: 7, amp: 0.6, param: 0.45, tint: "#8a5510" },
        { kind: "pebble", scale: 30, amp: 0.3, tint: "#c8831f" },
        { kind: "striate", scale: 70, amp: 0.18, tint: "#7a4a0c" },
      ],
    },
    geometry: { kind: "rhizome", detail: 4, displacement: 0.05, copies: 1, seed: 4004 },
  },

  nutmeg: {
    framing: 1,
    lightAngle: 1.2,
    material: {
      seed: 5005,
      base: "#8c5a32",
      second: "#b88553",
      third: "#422610",
      roughness: 0.55,
      roughnessVariance: 0.26,
      oiliness: 0.2,
      normalScale: 1.0,
      aoStrength: 0.65,
      features: [
        { kind: "reticulate", scale: 14, amp: 0.85, tint: "#6d421f" },
        { kind: "wrinkle", scale: 26, amp: 0.3, param: 0.4, tint: "#a8794a" },
        { kind: "bloom", scale: 5, amp: 0.15, tint: "#c9a06b" },
      ],
    },
    geometry: { kind: "nutmegOvoid", detail: 6, displacement: 0.03, copies: 1, seed: 5005 },
  },

  mace: {
    framing: 1.2,
    lightAngle: 0.4,
    material: {
      seed: 6006,
      base: "#c04526",
      second: "#e87c3e",
      third: "#661c0c",
      roughness: 0.42,
      roughnessVariance: 0.3,
      oiliness: 0.28,
      normalScale: 0.8,
      aoStrength: 0.6,
      features: [
        { kind: "veins", scale: 11, amp: 0.8, param: 0.5, tint: "#f29a52" },
        { kind: "wrinkle", scale: 30, amp: 0.25, param: 0.5, tint: "#8c2f16" },
      ],
    },
    geometry: { kind: "maceAril", detail: 4, displacement: 0.05, copies: 1, seed: 6006 },
  },

  cashewshell: {
    framing: 1.1,
    lightAngle: 0.8,
    material: {
      seed: 7007,
      base: "#6e6152",
      second: "#94866c",
      third: "#332b23",
      roughness: 0.72,
      roughnessVariance: 0.22,
      oiliness: 0.12,
      normalScale: 0.95,
      aoStrength: 0.7,
      sheen: 0.22,
      features: [
        { kind: "pebble", scale: 34, amp: 0.65, tint: "#8d7f68" },
        { kind: "wrinkle", scale: 12, amp: 0.35, param: 0.4, tint: "#5c5142" },
        { kind: "speckle", scale: 22, amp: 0.2, param: 0.2, tint: "#4a4034" },
      ],
    },
    geometry: {
      kind: "reniformShell",
      detail: 3,
      displacement: 0.035,
      copies: 2,
      spread: 0.52,
      seed: 7007,
    },
  },

  cashew: {
    framing: 1.1,
    lightAngle: 1.4,
    material: {
      seed: 8008,
      base: "#e6cba2",
      second: "#f6e4c0",
      third: "#a8835a",
      roughness: 0.5,
      roughnessVariance: 0.2,
      oiliness: 0.25,
      normalScale: 0.7,
      aoStrength: 0.5,
      sheen: 0.18,
      features: [
        { kind: "bloom", scale: 3.5, amp: 0.4, param: 0.8, tint: "#f8ecca" },
        { kind: "fibrous", scale: 30, amp: 0.25, param: 0.2, tint: "#c3a06c" },
        { kind: "speckle", scale: 48, amp: 0.12, param: 0.2, tint: "#b08a54" },
      ],
    },
    geometry: {
      kind: "kernel",
      detail: 3,
      displacement: 0.012,
      copies: 3,
      spread: 0.64,
      seed: 8008,
    },
  },

  ginger: {
    framing: 1.15,
    lightAngle: 0.95,
    material: {
      seed: 9009,
      base: "#a8895c",
      second: "#cdb287",
      third: "#59431f",
      roughness: 0.78,
      roughnessVariance: 0.22,
      oiliness: 0.08,
      normalScale: 1.05,
      aoStrength: 0.72,
      sheen: 0.24,
      features: [
        { kind: "fibrous", scale: 20, amp: 0.6, param: 0.14, tint: "#d2b98d" },
        { kind: "wrinkle", scale: 9, amp: 0.4, param: 0.4, tint: "#7a5f33" },
        { kind: "striate", scale: 55, amp: 0.25, tint: "#8a6c3c" },
      ],
    },
    geometry: { kind: "gingerRoot", detail: 4, displacement: 0.045, copies: 1, seed: 9009 },
  },

  tamarind: {
    framing: 1.15,
    lightAngle: 0.7,
    material: {
      seed: 10010,
      base: "#6f4322",
      second: "#93602f",
      third: "#32200f",
      roughness: 0.66,
      roughnessVariance: 0.32,
      oiliness: 0.18,
      normalScale: 1.0,
      aoStrength: 0.7,
      features: [
        { kind: "wrinkle", scale: 8, amp: 0.55, param: 0.5, tint: "#8a5a2d" },
        {
          kind: "bloom",
          scale: 6,
          amp: 0.35,
          param: 0.7,
          tint: "#a97e42",
          region: { base: 0.5, falloff: 0.42 },
        },
        { kind: "pebble", scale: 26, amp: 0.25, tint: "#5c3a1c" },
      ],
    },
    geometry: { kind: "longPod", detail: 5, displacement: 0.05, copies: 2, seed: 10010 },
  },

  kudampuli: {
    framing: 1.05,
    lightAngle: 1.3,
    material: {
      seed: 11011,
      base: "#5e2536",
      second: "#8a3a4c",
      third: "#240c12",
      roughness: 0.54,
      clearcoat: 0.16,
      clearcoatRoughness: 0.5,
      roughnessVariance: 0.35,
      oiliness: 0.22,
      normalScale: 1.15,
      aoStrength: 0.8,
      sheen: 0.16,
      features: [
        { kind: "wrinkle", scale: 6, amp: 0.85, param: 0.6, tint: "#7c2e40" },
        { kind: "pebble", scale: 22, amp: 0.3, tint: "#431828" },
        { kind: "striate", scale: 40, amp: 0.2, tint: "#8f4457" },
      ],
    },
    geometry: { kind: "wrinkledRind", detail: 5, displacement: 0.07, copies: 1, seed: 11011 },
  },
} satisfies Record<string, SpecimenRecipe>;

/**
 * Drop-in slot for real scanned models.
 *
 * There is no free CC0 library of spice specimens, so every spice ships with
 * procedural geometry. When a real `.glb` becomes available, place it in
 * `public/models/` and add one line here — nothing else changes.
 *
 * Convention for any model dropped in: glTF, metres, +Y up, origin at the
 * object's centre, roughly 0.05–0.25 units tall (a real specimen's scale).
 */
export const MODEL_OVERRIDES: Partial<Record<keyof typeof SPECIMEN_RECIPES, string>> = {
  // pepper: "/models/pepper.glb",
};

/** Where a dropped-in model's own textures should win over the procedural set. */
export const EMBEDDED_TEXTURE_OVERRIDES: Partial<
  Record<keyof typeof SPECIMEN_RECIPES, boolean>
> = {
  // pepper: true,
};

export type SpecimenId = keyof typeof SPECIMEN_RECIPES;

export function recipeFor(id: string): SpecimenRecipe {
  const recipe = (SPECIMEN_RECIPES as Record<string, SpecimenRecipe>)[id];
  if (!recipe) {
    throw new Error(
      `No specimen recipe for "${id}". Known ids: ${Object.keys(SPECIMEN_RECIPES).join(", ")}`
    );
  }
  return recipe;
}
