/**
 * Photography shot list.
 *
 * `AVAILABLE_IMAGES` maps a shot id to the file that backs it; `PhotoSlot` and
 * the image-card components render that file when it exists and an honest,
 * labelled placeholder when it does not.
 *
 * Product shots for the eleven spices currently point at licence-free
 * Wikimedia Commons photography in `public/products/<slug>/<slug>.jpg` — real
 * photos of the actual spice, but PLACEHOLDERS: swap in the client's own
 * studio photography (or add attribution) before a commercial launch. The
 * brand/lifestyle slots (farm scenes, packaging, lab) are still unshot, so
 * they continue to render their capture briefs.
 */

export interface Shot {
  id: string;
  /** Slot this file fills. */
  slot: "hero" | "packshot" | "macro" | "lifestyle" | "brand";
  /** Where it appears on the site. */
  placement: string;
  /** Recommended capture size, in pixels. */
  size: string;
  /** What the frame needs to contain. */
  direction: string;
  /** For per-spice shots, which spice. */
  spiceSlug?: string;
}

export const BRAND_SHOTS: Shot[] = [
  {
    id: "brand-hero",
    slot: "hero",
    placement: "Home — sourcing section, landscape",
    size: "2000 × 1250",
    direction:
      "Drying mats of reddening peppercorns under a Wayanad canopy, shot from a low angle in late-afternoon light. Must read as a real farm, not a stock plantation row.",
  },
  {
    id: "brand-packaging",
    slot: "packshot",
    placement: "Home — packaging section, portrait",
    size: "1400 × 1750",
    direction:
      "The resealable pouch and the 250 g tin side by side on a dark surface, single hard light from the left, label legible. Include the vacuum seal crimp so the closure is obvious.",
  },
  {
    id: "brand-hands",
    slot: "lifestyle",
    placement: "Farms page — process section, landscape",
    size: "1800 × 1200",
    direction:
      "Hands turning peppercorns on a mat, mid-motion. Shallow depth of field, warm highlights, no faces needed.",
  },
  {
    id: "brand-lab",
    slot: "brand",
    placement: "Trust section — landscape",
    size: "1600 × 1000",
    direction:
      "Batch sample jars with hand-written lot numbers lined up on a bench. This is the visual evidence for the batch-traceability claim.",
  },
];

/** Per-spice macro shots: the texture is the product, so these matter most. */
export const SPICE_SHOT_DIRECTION =
  "Single specimen, centred, on matte near-black, one hard key from upper-left and a warm rim from behind. Stack 8–15 frames at f/8 for full edge-to-edge sharpness. No colour grading that shifts the spice's own hue.";

export function spiceShots(spiceName: string, slug: string): Shot[] {
  return [
    {
      id: `${slug}-macro`,
      slot: "macro",
      placement: `${spiceName} — detail page, hero above the fold`,
      size: "1800 × 1800",
      direction: SPICE_SHOT_DIRECTION,
      spiceSlug: slug,
    },
    {
      id: `${slug}-packshot`,
      slot: "packshot",
      placement: `${spiceName} — detail page and collection card`,
      size: "1200 × 1500",
      direction:
        "The filled pouch standing upright and the loose spice beside it, so pack size is legible against the product.",
      spiceSlug: slug,
    },
  ];
}

export const ALL_SHOTS: Shot[] = [
  ...BRAND_SHOTS,
  ...(function collect(): Shot[] {
    // Kept explicit rather than importing the catalogue, so this file has no
    // dependency on product data and can be handed to a photographer as-is.
    const slugs: [string, string][] = [
      ["Black Pepper", "black-pepper"],
      ["Cardamom", "cardamom"],
      ["Cinnamon", "cinnamon"],
      ["Turmeric", "turmeric"],
      ["Nutmeg", "nutmeg"],
      ["Mace", "mace"],
      ["Cashew nut, in shell", "cashew-in-shell"],
      ["Cashew nut", "cashew-nut"],
      ["Dry Ginger", "dry-ginger"],
      ["Tamarind", "tamarind"],
      ["Malabar Tamarind", "malabar-tamarind"],
    ];
    return slugs.flatMap(([name, slug]) => spiceShots(name, slug));
  })(),
];

/**
 * Files that actually exist on disk, keyed by shot id.
 *
 * One photo backs both the macro and packshot slot per spice today. Drop a
 * dedicated macro or packshot next to it and point that key at the new file to
 * upgrade — every consumer resolves through here, so nothing else changes.
 */
const PRODUCT_SLUGS = [
  "black-pepper",
  "cardamom",
  "cinnamon",
  "turmeric",
  "nutmeg",
  "mace",
  "cashew-in-shell",
  "cashew-nut",
  "dry-ginger",
  "tamarind",
  "malabar-tamarind",
] as const;

/** Absolute prefix for asset URLs; empty locally, "/<repo>" on GitHub Pages. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const AVAILABLE_IMAGES: Record<string, string> = Object.fromEntries(
  PRODUCT_SLUGS.flatMap((slug) => [
    [`${slug}-macro`, `${BASE_PATH}/products/${slug}/${slug}.jpg`],
    [`${slug}-packshot`, `${BASE_PATH}/products/${slug}/${slug}.jpg`],
  ])
);

/** Primary product image for a spice slug, or undefined when not yet shot. */
export function spiceImage(slug: string): string | undefined {
  return AVAILABLE_IMAGES[`${slug}-macro`];
}
