/**
 * Deterministic noise primitives.
 *
 * Everything here is seeded and pure, so a specimen's geometry and its texture
 * maps are byte-identical on every run and between the CPU (geometry
 * displacement) and any offline tooling. No Math.random anywhere in the
 * specimen pipeline.
 */

/** Small, fast, seedable PRNG. Used for scatter/jitter, never for noise itself. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 32-bit integer hash -> [0,1). The basis of every noise field below. */
function hash3(i: number, j: number, k: number, seed: number): number {
  let h = seed | 0;
  h = Math.imul(h ^ (i | 0), 0x27d4eb2d);
  h = Math.imul(h ^ (j | 0), 0x165667b1);
  h = Math.imul(h ^ (k | 0), 0x9e3779b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Trilinearly interpolated value noise in [-1,1]. */
export function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = smoothstep(xf);
  const v = smoothstep(yf);
  const w = smoothstep(zf);

  const c000 = hash3(xi, yi, zi, seed);
  const c100 = hash3(xi + 1, yi, zi, seed);
  const c010 = hash3(xi, yi + 1, zi, seed);
  const c110 = hash3(xi + 1, yi + 1, zi, seed);
  const c001 = hash3(xi, yi, zi + 1, seed);
  const c101 = hash3(xi + 1, yi, zi + 1, seed);
  const c011 = hash3(xi, yi + 1, zi + 1, seed);
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed);

  const x00 = c000 + (c100 - c000) * u;
  const x10 = c010 + (c110 - c010) * u;
  const x01 = c001 + (c101 - c001) * u;
  const x11 = c011 + (c111 - c011) * u;
  const y0 = x00 + (x10 - x00) * v;
  const y1 = x01 + (x11 - x01) * v;
  return (y0 + (y1 - y0) * w) * 2 - 1;
}

/** Bilinearly interpolated value noise in [-1,1]. The texture workhorse. */
export function valueNoise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = smoothstep(xf);
  const v = smoothstep(yf);

  const c00 = hash3(xi, yi, 0, seed);
  const c10 = hash3(xi + 1, yi, 0, seed);
  const c01 = hash3(xi, yi + 1, 0, seed);
  const c11 = hash3(xi + 1, yi + 1, 0, seed);

  const x0 = c00 + (c10 - c00) * u;
  const x1 = c01 + (c11 - c01) * u;
  return (x0 + (x1 - x0) * v) * 2 - 1;
}

export interface FbmOptions {
  octaves?: number;
  lacunarity?: number;
  gain?: number;
}

/** Fractal sum of value noise. Returns roughly [-1,1]. */
export function fbm3(x: number, y: number, z: number, seed: number, opts: FbmOptions = {}): number {
  const { octaves = 4, lacunarity = 2, gain = 0.5 } = opts;
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  let fz = z;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise3(fx, fy, fz, seed + o * 131) * amp;
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
    fy *= lacunarity;
    fz *= lacunarity;
  }
  return sum / norm;
}

export function fbm2(x: number, y: number, seed: number, opts: FbmOptions = {}): number {
  const { octaves = 4, lacunarity = 2, gain = 0.5 } = opts;
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise2(fx, fy, seed + o * 131) * amp;
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
    fy *= lacunarity;
  }
  return sum / norm;
}

/**
 * Ridged multifractal. Produces sharp creases rather than soft blobs — the
 * right primitive for veins, wrinkles and fibrous roots.
 */
export function ridged3(x: number, y: number, z: number, seed: number, opts: FbmOptions = {}): number {
  const { octaves = 4, lacunarity = 2, gain = 0.5 } = opts;
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  let fz = z;
  for (let o = 0; o < octaves; o++) {
    sum += (1 - Math.abs(valueNoise3(fx, fy, fz, seed + o * 977))) * amp;
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
    fy *= lacunarity;
    fz *= lacunarity;
  }
  return (sum / norm) * 2 - 1;
}

export function ridged2(x: number, y: number, seed: number, opts: FbmOptions = {}): number {
  const { octaves = 4, lacunarity = 2, gain = 0.5 } = opts;
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let o = 0; o < octaves; o++) {
    sum += (1 - Math.abs(valueNoise2(fx, fy, seed + o * 977))) * amp;
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
    fy *= lacunarity;
  }
  return (sum / norm) * 2 - 1;
}

export interface WorleyResult {
  /** Distance to the nearest feature point. Low inside a cell. */
  f1: number;
  /** Distance to the second nearest. `f2 - f1` is bright on cell borders. */
  f2: number;
}

/** Cellular / Worley noise over a 3x3x3 neighbourhood. */
export function worley3(x: number, y: number, z: number, seed: number): WorleyResult {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  let f1 = 1e9;
  let f2 = 1e9;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const cx = xi + dx;
        const cy = yi + dy;
        const cz = zi + dz;
        const px = cx + hash3(cx, cy, cz, seed);
        const py = cy + hash3(cx, cy, cz, seed + 7919);
        const pz = cz + hash3(cx, cy, cz, seed + 104729);
        const ddx = px - x;
        const ddy = py - y;
        const ddz = pz - z;
        const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz);
        if (d < f1) {
          f2 = f1;
          f1 = d;
        } else if (d < f2) {
          f2 = d;
        }
      }
    }
  }
  return { f1, f2 };
}

export function worley2(x: number, y: number, seed: number): WorleyResult {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  let f1 = 1e9;
  let f2 = 1e9;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cx = xi + dx;
      const cy = yi + dy;
      const px = cx + hash3(cx, cy, 0, seed);
      const py = cy + hash3(cx, cy, 0, seed + 7919);
      const ddx = px - x;
      const ddy = py - y;
      const d = Math.sqrt(ddx * ddx + ddy * ddy);
      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }
  return { f1, f2 };
}

/**
 * Domain warping: offsets the sample position by another noise field before
 * sampling. This is what turns soft blobs into the swirled, folded forms that
 * read as organic (a rhizome's knots, a wrinkled rind).
 */
export function warp3(
  x: number,
  y: number,
  z: number,
  seed: number,
  amp = 0.35,
  freq = 1.6
): [number, number, number] {
  const wx = fbm3(x * freq + 11.3, y * freq + 4.7, z * freq + 21.1, seed + 101, { octaves: 3 });
  const wy = fbm3(x * freq + 51.9, y * freq + 17.2, z * freq + 8.4, seed + 211, { octaves: 3 });
  const wz = fbm3(x * freq + 3.1, y * freq + 61.5, z * freq + 33.8, seed + 307, { octaves: 3 });
  return [x + wx * amp, y + wy * amp, z + wz * amp];
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstepRange(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0 || 1e-6));
  return t * t * (3 - 2 * t);
}
