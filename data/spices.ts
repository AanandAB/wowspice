import type { CSSProperties } from "react";
import type { SpecimenId } from "@/lib/three/recipes";

/**
 * The catalogue.
 *
 * Two distinct colour systems live here and they are not the same thing:
 *   - `palette` drives the UI. These are saturated and deliberately vivid,
 *     because their job is to make the page re-skin on every spice.
 *   - the material colours live in lib/three/recipes.ts and are naturalistic,
 *     because their job is to make the object look real.
 * Keeping them separate is what stops the 3D reading as a cartoon.
 */

export interface SpicePalette {
  /** Deep background the whole page sits on. */
  bg: string;
  /** Vivid accent for chrome, glows and lighting tints. */
  accent: string;
}

export interface LocalName {
  roman: string;
  /** Malayalam. Flagged for native-speaker verification before it goes to print. */
  script: string;
  needsReview: boolean;
}

export interface Spice {
  id: SpecimenId;
  slug: string;
  name: string;
  local: LocalName;
  tagline: string;
  description: string;
  /** What the specimen actually looks like, for the alt text and the lab. */
  specimenDescription: string;
  origin: {
    place: string;
    district: string;
    state: string;
    altitude: string;
    farms: number;
  };
  harvest: string;
  /** The farmgate story: who grows it and how it is processed. */
  sourcing: string;
  process: string;
  flavorNotes: string[];
  /** 0–5, used for filtering and for the heat meter. */
  heat: number;
  uses: string[];
  storage: string;
  pairsWith: SpecimenId[];
  /** Price in INR per 100 g. */
  basePrice: number;
  rating: number;
  reviewCount: number;
  dietary: string[];
  palette: SpicePalette;
  metaTitle: string;
  metaDescription: string;
}

export interface PackSize {
  label: string;
  grams: number;
  multiplier: number;
}

/** Volume tiers. Larger packs are cheaper per gram, as they should be. */
export const PACKS: PackSize[] = [
  { label: "100 g", grams: 100, multiplier: 1 },
  { label: "250 g", grams: 250, multiplier: 2.35 },
  { label: "500 g", grams: 500, multiplier: 4.4 },
  { label: "1 kg", grams: 1000, multiplier: 8.3 },
];

export interface GrindOption {
  id: "whole" | "ground";
  label: string;
  note: string;
  /** Fractional surcharge for grinding to order. */
  surcharge: number;
}

export const GRINDS: GrindOption[] = [
  {
    id: "whole",
    label: "Whole",
    note: "Keeps its volatile oils for two years or more in a sealed jar.",
    surcharge: 0,
  },
  {
    id: "ground",
    label: "Ground to order",
    note: "Ground the morning we dispatch, so it arrives at full aroma.",
    surcharge: 0.06,
  },
];

export const SPICES: Spice[] = [
  {
    id: "pepper",
    slug: "black-pepper",
    name: "Black Pepper",
    local: { roman: "Karutha Mulaku", script: "കറുത്ത മുളക്", needsReview: true },
    tagline: "Sun-dried peppercorns with a sharp, resinous heat.",
    description:
      "Hand-picked at the point the lower berries turn red, then sun-dried on woven mats until the skin shrivels and blackens around the seed. That shrivelling is the whole point: it traps the piperine and the volatile oils that a machine-dried berry loses. Crack one and it should smell of pine resin and citrus peel before it smells of heat.",
    specimenDescription:
      "A single dried berry, near-black, with a deeply wrinkled and dimpled skin over a hard pale core.",
    origin: {
      place: "Vythiri",
      district: "Wayanad",
      state: "Kerala",
      altitude: "780–940 m",
      farms: 34,
    },
    harvest: "December – February",
    sourcing:
      "Thirty-four smallholdings around Vythiri, most under two acres, growing pepper up the same standards as their coffee. Vines are trained on live support trees rather than concrete posts, which is slower and yields less, and produces a denser berry.",
    process:
      "Hand-picked, threshed the same day, then dried on mats for five to seven days and turned twice daily. Never kiln-dried.",
    flavorNotes: ["Pine resin", "Citrus peel", "Warm bite", "Woodsmoke"],
    heat: 3,
    uses: [
      "Cracked over eggs and salads at the table",
      "The base of rasam and pepper water",
      "Dry rubs for beef and lamb",
    ],
    storage:
      "Whole in a sealed jar away from light for up to two years. Ground pepper loses its aroma within about six weeks, so grind per meal.",
    pairsWith: ["turmeric", "cinnamon", "ginger"],
    basePrice: 180,
    rating: 4.8,
    reviewCount: 312,
    dietary: ["Vegan", "No additives", "Single origin"],
    palette: { bg: "#100d0c", accent: "#d9722c" },
    metaTitle: "Black Pepper — Karutha Mulaku from Wayanad",
    metaDescription:
      "Whole sun-dried Malabar peppercorns from smallholdings in Vythiri, Wayanad. Hand-picked, mat-dried, never kiln-dried.",
  },
  {
    id: "cardamom",
    slug: "cardamom",
    name: "Cardamom",
    local: { roman: "Elakka", script: "ഏലം", needsReview: true },
    tagline: "Plump green pods from the high shade, sweet and camphor-cool.",
    description:
      "Cardamom is picked just before the pod splits, because the moment it opens the volatile oils start leaving. These are hand-graded for size and colour, and the pods should feel heavy for their size and smell faintly of eucalyptus and lemon when you crush one.",
    specimenDescription:
      "Three pale-green pods, spindle-shaped with fine longitudinal striations, tapering to a small beak.",
    origin: {
      place: "Vandanmedu",
      district: "Idukki",
      state: "Kerala",
      altitude: "900–1,120 m",
      farms: 21,
    },
    harvest: "August – November",
    sourcing:
      "Twenty-one holdings in the Cardamom Hills, where the crop grows under natural forest shade rather than in cleared plantation rows. Shade-grown pods develop more slowly and grade out smaller, but they carry a markedly higher oil content.",
    process:
      "Picked at 75–80 days, cured at low temperature over four days, then graded into 8 mm and 7 mm lots.",
    flavorNotes: ["Eucalyptus", "Lemon peel", "Honeyed", "Camphor"],
    heat: 0,
    uses: [
      "Chai and filter coffee",
      "Biryani and pulao",
      "Ground into garam masala",
      "Sweet custards and payasam",
    ],
    storage:
      "Whole pods only, in an airtight jar. Pre-ground cardamom is mostly seed coat and dust — the flavour sits in the seed inside the pod.",
    pairsWith: ["cinnamon", "nutmeg", "mace"],
    basePrice: 450,
    rating: 4.9,
    reviewCount: 208,
    dietary: ["Vegan", "No additives", "Shade grown"],
    palette: { bg: "#0d1a12", accent: "#86c46b" },
    metaTitle: "Cardamom — Elakka from the Cardamom Hills",
    metaDescription:
      "Whole shade-grown green cardamom pods from Vandanmedu, Idukki. Hand-graded, low-temperature cured, high oil content.",
  },
  {
    id: "cinnamon",
    slug: "cinnamon",
    name: "Cinnamon",
    local: { roman: "Karuvapatta", script: "കറുവപ്പട്ട", needsReview: true },
    tagline: "Thin hand-rolled quills, warm and delicately sweet.",
    description:
      "Peeled from young shoots during the monsoon flush, when the bark lifts cleanly from the wood, then rolled by hand while still damp. What most shops sell as cinnamon is actually cassia: thicker, harder, and far rougher on the throat. A true quill is thin enough to snap between two fingers and smells of oranges rather than of dust.",
    specimenDescription:
      "A rolled quill of very thin bark, spiralled into itself so the layers are visible at either end.",
    origin: {
      place: "Thamarassery",
      district: "Kozhikode",
      state: "Kerala",
      altitude: "240–520 m",
      farms: 16,
    },
    harvest: "June – October",
    sourcing:
      "Sixteen holdings on the lower slopes of the Thamarassery gap, where the bark strips cleanly during the south-west monsoon. Peeled by a three-person team that has worked together for eleven years.",
    process:
      "Shoots cut, bark peeled within hours, rolled by hand and dried in the shade so the quills cure slowly without splitting.",
    flavorNotes: ["Orange peel", "Warm wood", "Faint clove", "Sweet finish"],
    heat: 0,
    uses: [
      "Stewed and braised meat",
      "Rice puddings and fruit",
      "Mulled wine and chai",
      "Curries where cassia would overwhelm",
    ],
    storage:
      "Whole quills keep their aroma for well over a year. Break off what you need rather than buying ground cinnamon.",
    pairsWith: ["cardamom", "nutmeg", "pepper"],
    basePrice: 120,
    rating: 4.7,
    reviewCount: 176,
    dietary: ["Vegan", "No additives", "True cinnamon"],
    palette: { bg: "#1b0f08", accent: "#c9691f" },
    metaTitle: "Cinnamon — Karuvapatta quills from Kozhikode",
    metaDescription:
      "Thin hand-rolled true cinnamon quills from Thamarassery, Kozhikode. Peeling-grade bark, shade-cured, not cassia.",
  },
  {
    id: "turmeric",
    slug: "turmeric",
    name: "Turmeric",
    local: { roman: "Manjal", script: "മഞ്ഞൾ", needsReview: true },
    tagline: "Deep-orange rhizomes, earthy, with a high curcumin content.",
    description:
      "Boiled, sun-dried and polished, then sold as whole fingers rather than powder. Whole fingers let you see what you are buying: a good one snaps with a resinous crack and shows a deep orange core the whole way through. Pale, chalky fingers with a whitish core have been bulked out or over-boiled.",
    specimenDescription:
      "A knobbly rhizome with segmented fingers, deep orange where cut, darker brown where the skin dried.",
    origin: {
      place: "Mananthavady",
      district: "Wayanad",
      state: "Kerala",
      altitude: "700–880 m",
      farms: 27,
    },
    harvest: "January – March",
    sourcing:
      "Twenty-seven holdings, all growing the local finger variety rather than the higher-yielding grafted stock. Yields are lower and curcumin levels are consistently higher.",
    process:
      "Boiled for 45–60 minutes, sun-dried on stone for 10–14 days, then hand-polished. No colouring, no polishing agents.",
    flavorNotes: ["Earthy", "Mustard-like", "Bitter edge", "Warm root"],
    heat: 0,
    uses: [
      "Everyday dals and curries",
      "Golden milk",
      "Pickles and preserves",
      "Rice for an instant yellow",
    ],
    storage:
      "Whole fingers in a dark jar for up to a year. Turmeric fades in light faster than almost any other spice in the rack.",
    pairsWith: ["pepper", "ginger", "tamarind"],
    basePrice: 60,
    rating: 4.6,
    reviewCount: 421,
    dietary: ["Vegan", "No colouring added", "Single origin"],
    palette: { bg: "#1e1503", accent: "#f2b01e" },
    metaTitle: "Turmeric — Manjal fingers from Wayanad",
    metaDescription:
      "Whole turmeric fingers from Mananthavady, Wayanad. Hand-boiled and stone-dried, high curcumin, no added colour.",
  },
  {
    id: "nutmeg",
    slug: "nutmeg",
    name: "Nutmeg",
    local: { roman: "Jathikka", script: "ജാതിക്ക", needsReview: true },
    tagline: "Whole dried kernels, warm and quietly sweet.",
    description:
      "Dried slowly in the shell so the kernel holds its oils, then cracked out and graded. Whole nutmeg is one of the few spices where the difference between whole and pre-ground is dramatic: freshly grated, it is floral and almost sweet; six weeks after grinding it is only dust with a memory of the flavour.",
    specimenDescription:
      "An oval kernel, warm brown, its surface covered in a fine net of raised lines over a matte skin.",
    origin: {
      place: "Pala",
      district: "Kottayam",
      state: "Kerala",
      altitude: "60–180 m",
      farms: 19,
    },
    harvest: "June – August",
    sourcing:
      "Nineteen holdings in the Meenachil lowlands, where nutmeg grows as an intercrop beneath coconut. Trees are mature, most over twenty-five years, which shows in the density of the kernel.",
    process:
      "Fruit split by hand, kernel dried in its shell for three to five weeks, then cracked and graded by size.",
    flavorNotes: ["Warm spice", "Nutty", "Faint clove", "Sweet resin"],
    heat: 0,
    uses: [
      "Béchamel and gratins",
      "Curries with lamb or pork",
      "Mulled wine",
      "Baked custard and eggnog",
    ],
    storage:
      "Keep whole in a sealed jar and grate on a fine microplane as needed. Whole nutmeg holds its aroma for two years or more.",
    pairsWith: ["mace", "cardamom", "cinnamon"],
    basePrice: 300,
    rating: 4.8,
    reviewCount: 139,
    dietary: ["Vegan", "No additives", "Whole kernel"],
    palette: { bg: "#17100a", accent: "#a9662f" },
    metaTitle: "Nutmeg — Jathikka from the Kottayam lowlands",
    metaDescription:
      "Whole nutmeg kernels from Pala, Kottayam. Shell-dried for three to five weeks, hand-graded, no additives.",
  },
  {
    id: "mace",
    slug: "mace",
    name: "Mace",
    local: { roman: "Jathipathri", script: "ജാതിപ്പത്രി", needsReview: true },
    tagline: "The lacy crimson aril that wraps each nutmeg.",
    description:
      "Mace is the net that grows around the nutmeg seed, peeled off whole and dried flat. It carries a warmer, more citrus-tinted flavour than the nut itself, and its colour is the reason old recipes specify it in dishes you want to look golden. Genuinely hard to find undyed.",
    specimenDescription:
      "Flat, torn, branching lobes in crimson-orange, wrapping a darker kernel at the centre.",
    origin: {
      place: "Thodupuzha",
      district: "Idukki",
      state: "Kerala",
      altitude: "60–200 m",
      farms: 14,
    },
    harvest: "June – August",
    sourcing:
      "Fourteen holdings that pair nutmeg trees with the mace harvest, so the aril is peeled the day the fruit is split rather than left to oxidise. Undyed: the colour you see is the colour it dried.",
    process:
      "Peeled whole, flattened by hand, and shade-dried for two to three days to hold the crimson rather than letting it brown.",
    flavorNotes: ["Cinnamon-orange", "Peppery", "Warm", "Faint citrus"],
    heat: 1,
    uses: [
      "Biryani and rich meat curries",
      "Béchamel and cream sauces",
      "Pickles",
      "Anything you want to turn golden",
    ],
    storage:
      "Whole blades in a sealed jar, away from light, for up to a year. Mace fades in colour long before it fades in flavour.",
    pairsWith: ["nutmeg", "cardamom", "cinnamon"],
    basePrice: 550,
    rating: 4.7,
    reviewCount: 96,
    dietary: ["Vegan", "No added colour", "Undyed"],
    palette: { bg: "#200a06", accent: "#e8452a" },
    metaTitle: "Mace — Jathipathri from Thodupuzha",
    metaDescription:
      "Whole undyed mace blades from Thodupuzha, Idukki. Hand-peeled the day the nut is split and shade-dried.",
  },
  {
    id: "cashewshell",
    slug: "cashew-in-shell",
    name: "Cashew nut, in shell",
    local: { roman: "Kappalandi, unshelled", script: "കപ്പലണ്ടി", needsReview: true },
    tagline: "Raw cashews with the shell still on, straight off the orchard floor.",
    description:
      "Sold exactly as they come off the tree, shell and all. The shell keeps the kernel from going rancid, so these will still be good in a year if you store them dry. Roast them over sand or a dry pan until the shell starts to give, then crack them. It is a bit of work and the reward is worth it.",
    specimenDescription:
      "Two grey-brown shelled nuts, kidney-curved, with a pebbled, slightly waxy outer skin.",
    origin: {
      place: "Kollam coast",
      district: "Kollam",
      state: "Kerala",
      altitude: "Sea level – 80 m",
      farms: 41,
    },
    harvest: "March – May",
    sourcing:
      "Forty-one smallholders along the Kollam coast, where cashew grows on sandy laterite. The whole harvest is the by-product of the apple crop, which is why the nuts are only ever a sideline for these families.",
    process:
      "Apples harvested, nuts detached and sun-dried for three days. Nothing else is done to them, which is exactly the point.",
    flavorNotes: ["Buttery", "Faintly sweet", "Woody", "Richer than shelled"],
    heat: 0,
    uses: [
      "Roasted and salted at home",
      "Cashew butter, ground yourself",
      "Curries, once shelled",
      "Festive gift boxes",
    ],
    storage:
      "Dry and airtight. In the shell, out of sunlight, they hold for a year or more.",
    pairsWith: ["pepper", "turmeric", "ginger"],
    basePrice: 150,
    rating: 4.5,
    reviewCount: 88,
    dietary: ["Vegan", "Raw", "In shell"],
    palette: { bg: "#131110", accent: "#9e8a6b" },
    metaTitle: "Cashew nut in shell — Kappalandi from Kollam",
    metaDescription:
      "Raw unshelled cashew nuts from smallholders along the Kollam coast. Sun-dried, unsalted, straight from the orchard.",
  },
  {
    id: "cashew",
    slug: "cashew-nut",
    name: "Cashew nut",
    local: { roman: "Kappalandi", script: "കപ്പലണ്ടി", needsReview: true },
    tagline: "Hand-shelled, lightly roasted, whole kernels.",
    description:
      "Shelled by hand and graded for size, then given a short roast that brings the sugars up without turning the kernel oily. These snap cleanly when you bite them; if a cashew bends instead of snapping it has taken on moisture somewhere in its journey.",
    specimenDescription:
      "Three whole cream-coloured kernels, kidney-curved, matte, with a slight seam along the inner curve.",
    origin: {
      place: "Kollam coast",
      district: "Kollam",
      state: "Kerala",
      altitude: "Sea level – 80 m",
      farms: 41,
    },
    harvest: "March – May",
    sourcing:
      "From the same forty-one Kollam holdings as the in-shell lots. Hand-shelled by a women's cooperative in Kollam town, which sets its own rates rather than taking the prevailing piece-rate.",
    process:
      "Steam-shelled, sun-dried, graded to W240, then lightly dry-roasted to finish.",
    flavorNotes: ["Buttery", "Sweet", "Clean snap", "Not oily"],
    heat: 0,
    uses: ["Snacking", "Korma and kurma", "Cashew butter", "Garnish for biryani"],
    storage:
      "Airtight and out of light. Roasted cashews are the first thing in a spice drawer to go stale.",
    pairsWith: ["cardamom", "turmeric", "cinnamon"],
    basePrice: 220,
    rating: 4.8,
    reviewCount: 264,
    dietary: ["Vegan", "No oil added", "W240 grade"],
    palette: { bg: "#191510", accent: "#f0d8a8" },
    metaTitle: "Cashew nut — whole W240 kernels from Kollam",
    metaDescription:
      "Whole hand-shelled cashew kernels from Kollam, Kerala. Cooperative-shelled, W240 graded, lightly dry-roasted.",
  },
  {
    id: "ginger",
    slug: "dry-ginger",
    name: "Dry Ginger",
    local: { roman: "Chukku", script: "ചുക്ക്", needsReview: true },
    tagline: "Peeled and sun-dried ginger, sharper and deeper than fresh.",
    description:
      "Fresh ginger peeled and dried in the sun until it concentrates into hard, pale, fibrous knots. Drying does something fresh ginger cannot: it converts the pungent compounds and produces that deep, hot, almost smoky warmth that a chukku coffee or a winter kashayam is built on. Fresh ginger is a poor substitute for this.",
    specimenDescription:
      "A pale straw-coloured dried root with a fibrous, wrinkled surface and knotted segments.",
    origin: {
      place: "Sulthan Bathery",
      district: "Wayanad",
      state: "Kerala",
      altitude: "760–980 m",
      farms: 23,
    },
    harvest: "January – February",
    sourcing:
      "Twenty-three holdings at the eastern edge of Wayanad, growing the small local variety with a high fibre content that gives dried ginger its bite. The larger hybrid varieties dry out bland.",
    process:
      "Peeled, then sun-dried for 12–18 days and turned daily until a finger snaps cleanly rather than bending.",
    flavorNotes: ["Hot and dry", "Citrus oil", "Fibrous", "Deeply warming"],
    heat: 2,
    uses: [
      "Kashayam and chukku coffee",
      "Rasam and pepper water",
      "Everyday dals",
      "Ginger tea",
    ],
    storage:
      "Whole in a sealed jar for up to a year. Keep it dry: dried ginger reabsorbs moisture readily.",
    pairsWith: ["pepper", "cardamom", "tamarind"],
    basePrice: 140,
    rating: 4.6,
    reviewCount: 152,
    dietary: ["Vegan", "No additives", "Sun-dried"],
    palette: { bg: "#191308", accent: "#d9b26a" },
    metaTitle: "Dry Ginger — Chukku from Sulthan Bathery",
    metaDescription:
      "Whole sun-dried ginger root from Wayanad. Peeled, dried for 12–18 days, high-fibre local variety.",
  },
  {
    id: "tamarind",
    slug: "tamarind",
    name: "Tamarind",
    local: { roman: "Puli", script: "പുളി", needsReview: true },
    tagline: "Sticky, tangy pods pressed into dense brick.",
    description:
      "Deshelled, de-veined and pressed into a brick so it keeps without additives. It is sour in a rounded, fruity way rather than a sharp one, which is why it carries a sambar rather than cutting through it. Pale bricks are usually under-ripe, or bulked out with the seed pulp.",
    specimenDescription:
      "Two bowed brown pods with bulges over each seed, the surface dull and lightly bloomed.",
    origin: {
      place: "Alathur",
      district: "Palakkad",
      state: "Kerala",
      altitude: "80–220 m",
      farms: 29,
    },
    harvest: "February – April",
    sourcing:
      "Twenty-nine holdings across the Palakkad gap, where the heat ripens the pod fully and gives a darker, sweeter pulp than the wetter districts manage.",
    process:
      "Pods harvested dry, shelled, de-veined and pressed into blocks. No sugar, no preservative, no water added.",
    flavorNotes: ["Tangy", "Fruity", "Faint molasses", "Rounded sour"],
    heat: 0,
    uses: ["Sambar and rasam", "Fish curry", "Chutneys", "Tamarind rice"],
    storage:
      "Pressed brick in a sealed jar holds for over a year. If the surface hardens, a splash of hot water revives it.",
    pairsWith: ["kudampuli", "turmeric", "ginger"],
    basePrice: 70,
    rating: 4.7,
    reviewCount: 197,
    dietary: ["Vegan", "No sugar added", "No preservatives"],
    palette: { bg: "#150d07", accent: "#8a5a2b" },
    metaTitle: "Tamarind — Puli from the Palakkad gap",
    metaDescription:
      "Pressed seedless tamarind from Alathur, Palakkad. Deshelled, de-veined, no sugar or preservatives added.",
  },
  {
    id: "kudampuli",
    slug: "malabar-tamarind",
    name: "Malabar Tamarind",
    local: { roman: "Kudampuli", script: "കുടംപുളി", needsReview: true },
    tagline: "Smoked dark rind, the sourness underneath a Malabar fish curry.",
    description:
      "Sun-dried and smoked until the rind is almost black, then stored in salt. Its sourness is deep and smoky where tamarind is bright and fruity, and a Malabar fish curry made without it simply is not a Malabar fish curry. Two or three pieces are usually enough for a whole pot.",
    specimenDescription:
      "A heavily shrivelled dark maroon rind, glossy in places, with a short woody stem.",
    origin: {
      place: "Kodungallur",
      district: "Thrissur",
      state: "Kerala",
      altitude: "Sea level – 40 m",
      farms: 12,
    },
    harvest: "June – September",
    sourcing:
      "Twelve holdings around Kodungallur, where the fruit is smoke-dried over coconut shell in the traditional way rather than sun-dried. It is slower and gives the resinous edge that sun-drying cannot.",
    process:
      "Fruit split and the seeds removed, then smoked over coconut shell for three to four days, then salted down.",
    flavorNotes: ["Smoky", "Deep sour", "Resinous", "Faintly saline"],
    heat: 0,
    uses: [
      "Malabar fish curry",
      "Meen vevichathu",
      "Souring lentil curries",
      "Anything that needs smoke as well as sour",
    ],
    storage:
      "Keeps indefinitely in a sealed jar. Expect it to darken further with age, which does no harm.",
    pairsWith: ["tamarind", "turmeric", "pepper"],
    basePrice: 160,
    rating: 4.9,
    reviewCount: 118,
    dietary: ["Vegan", "Smoke-dried", "Salted"],
    palette: { bg: "#170a0c", accent: "#9b2f4a" },
    metaTitle: "Malabar Tamarind — Kudampuli from Kodungallur",
    metaDescription:
      "Smoke-dried Malabar tamarind rind from Kodungallur, Thrissur. Coconut-shell smoked, salted, the base of Malabar fish curry.",
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function getSpice(slug: string): Spice | undefined {
  return SPICES.find((s) => s.slug === slug);
}

export function getSpiceById(id: SpecimenId): Spice | undefined {
  return SPICES.find((s) => s.id === id);
}

export function spiceIndex(id: SpecimenId): number {
  return SPICES.findIndex((s) => s.id === id);
}

/** Neighbours for the carousel, wrapping at both ends. */
export function neighbourSpice(id: SpecimenId, offset: number): Spice {
  const index = spiceIndex(id);
  const next = (index + offset + SPICES.length) % SPICES.length;
  return SPICES[next];
}

/** "217 114 44" — the form the CSS custom properties are consumed in. */
export function accentTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** CSS custom properties are not part of CSSProperties, so declare them. */
export type CSSVars = CSSProperties & Record<`--${string}`, string>;

/** Inline variables that re-skin the entire page for one spice. */
export function paletteStyle(spice: Spice): CSSVars {
  return {
    "--ws-accent": accentTriplet(spice.palette.accent),
    "--ws-bg": spice.palette.bg,
  };
}

/**
 * The layered background for a spice: a pool of accent light sitting in a much
 * deeper field, which is what makes the specimen look like it is lit rather
 * than pasted onto a flat fill.
 */
export function backdrop(spice: Spice): string {
  const a = spice.palette.accent;
  return [
    `radial-gradient(58% 46% at 50% 34%, ${a}2e 0%, transparent 72%)`,
    `radial-gradient(100% 70% at 50% 108%, ${a}14 0%, transparent 70%)`,
    `linear-gradient(180deg, ${spice.palette.bg} 0%, #060504 100%)`,
  ].join(", ");
}
