import * as THREE from "three";

/**
 * Procedural studio environment.
 *
 * An environment map is what makes a PBR material read as photographic rather
 * than as flat shading. Shipping a real HDRI would add megabytes and a licence
 * question, so we synthesise a small equirectangular light probe on a canvas:
 * a dark room with two softboxes and a rim strip.
 *
 * It is tinted with the spice's own accent, which is what makes the *lighting*
 * change colour when you move between spices, not just the background.
 */

/**
 * Renderer settings shared by every specimen canvas.
 *
 * These live in one place for a reason. A mismatch here is invisible in the
 * source and glaring on screen: the carousel, the collection grid and the
 * product viewer all render the *same* geometry and materials, so if one of
 * them omits the exposure the others set, that page looks like the model is
 * suddenly unlit and the obvious-but-wrong fix is to go and brighten the
 * materials. One constant means the three surfaces can not drift.
 */
export const SPECIMEN_GL = {
  antialias: true,
  alpha: true,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.44,
};

const ENV_WIDTH = 1024;
const ENV_HEIGHT = 512;

function paintSoftbox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  color: string,
  intensity: number
): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radiusX, radiusY));
  gradient.addColorStop(0, hexWithAlpha(color, intensity));
  gradient.addColorStop(0.4, hexWithAlpha(color, intensity * 0.42));
  gradient.addColorStop(1, hexWithAlpha(color, 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, radiusY / radiusX);
  ctx.translate(-x, -y);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radiusX, y - radiusX, radiusX * 2, radiusX * 2);
  ctx.restore();
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const n = parseInt(clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function makeStudioEquirect(bg: string, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = ENV_WIDTH;
  canvas.height = ENV_HEIGHT;
  const ctx = canvas.getContext("2d")!;

  // The room itself: a very dark field that still carries a hint of the spice.
  ctx.fillStyle = "#050403";
  ctx.fillRect(0, 0, ENV_WIDTH, ENV_HEIGHT);

  const wash = ctx.createLinearGradient(0, 0, 0, ENV_HEIGHT);
  wash.addColorStop(0, hexWithAlpha(bg, 0.95));
  wash.addColorStop(0.55, hexWithAlpha(bg, 0.5));
  wash.addColorStop(1, "#040302");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, ENV_WIDTH, ENV_HEIGHT);

  // Overhead wash. Without this the upper hemisphere of the probe is nearly
  // black, and every specimen reads as a silhouette rather than a lit object.
  paintSoftbox(ctx, ENV_WIDTH * 0.5, ENV_HEIGHT * 0.08, 420, 200, "#fff4e4", 0.5);

  // Key softbox: large, upper-left of the equirect, warm and mostly neutral so
  // the specimen keeps its own material colour.
  paintSoftbox(ctx, ENV_WIDTH * 0.22, ENV_HEIGHT * 0.3, 268, 190, "#fff6e8", 1.25);

  // Fill: smaller, right side, tinted with the accent. This is the light that
  // puts a spice-coloured rim on the specimen.
  paintSoftbox(ctx, ENV_WIDTH * 0.74, ENV_HEIGHT * 0.36, 205, 152, accent, 0.92);

  // A third, dim, low source keeps the underside from going pure black.
  paintSoftbox(ctx, ENV_WIDTH * 0.5, ENV_HEIGHT * 0.82, 340, 130, accent, 0.26);

  // Rim strip along the horizon: a thin bright band that produces the edge
  // highlight separating the specimen from the background.
  const rim = ctx.createLinearGradient(0, ENV_HEIGHT * 0.44, 0, ENV_HEIGHT * 0.54);
  rim.addColorStop(0, "rgba(255,255,255,0)");
  rim.addColorStop(0.5, hexWithAlpha(accent, 0.72));
  rim.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, ENV_HEIGHT * 0.44, ENV_WIDTH, ENV_HEIGHT * 0.1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/* -------------------------------------------------------------------------- */
/* Prefiltered environment cache                                              */
/* -------------------------------------------------------------------------- */

interface CachedEnvironment {
  texture: THREE.Texture;
  source: THREE.CanvasTexture;
}

const envCache = new Map<string, CachedEnvironment>();

/**
 * Returns a PMREM-prefiltered environment texture for a spice palette.
 *
 * Cache this aggressively: generating one costs a render pass, and the same
 * palette is requested on every mount of the home and detail scenes.
 */
export function getStudioEnvironment(
  renderer: THREE.WebGLRenderer,
  bg: string,
  accent: string
): THREE.Texture {
  const key = `${bg}|${accent}`;
  const hit = envCache.get(key);
  if (hit) return hit.texture;

  const source = makeStudioEquirect(bg, accent);
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromEquirectangular(source);
  pmrem.dispose();

  const entry: CachedEnvironment = { texture: target.texture, source };
  envCache.set(key, entry);
  return entry.texture;
}

export function disposeStudioEnvironments(): void {
  for (const entry of envCache.values()) {
    entry.texture.dispose();
    entry.source.dispose();
  }
  envCache.clear();
}
