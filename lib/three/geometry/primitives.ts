import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm3, mulberry32, warp3 } from "../noise";

/**
 * Geometric primitives shared by every specimen builder.
 *
 * A note on why this exists instead of using MarchingCubes from three/addons:
 * addons/objects/MarchingCubes exposes its field but only writes results into
 * its own Mesh attributes via update() (no geometry extraction), and the
 * channels it produces do not line up with the UV layout our texture generator
 * depends on. Sweeping profiles along explicit paths keeps the whole specimen
 * pipeline deterministic, correctly UV'd, and free of seam artefacts.
 */

export type Vec3 = [number, number, number];

/* -------------------------------------------------------------------------- */
/* Displacement                                                               */
/* -------------------------------------------------------------------------- */

export type DisplacementSampler = (
  x: number,
  y: number,
  z: number,
  nx: number,
  ny: number,
  nz: number
) => number;

/**
 * Pushes every vertex along its own normal.
 *
 * Sampling is done by *position*, never by UV. Geometry seams (the duplicated
 * column where a tube wraps) share a position, so they receive an identical
 * offset and the surface stays watertight. Sampling by UV would tear every
 * specimen open along its seam.
 */
export function displaceAlongNormals(
  geometry: THREE.BufferGeometry,
  amount: number,
  sampler: DisplacementSampler
): THREE.BufferGeometry {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  let normal = geometry.attributes.normal as THREE.BufferAttribute | undefined;

  if (!normal) {
    geometry.computeVertexNormals();
    normal = geometry.attributes.normal as THREE.BufferAttribute;
  }

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);
    const d = sampler(x, y, z, nx, ny, nz) * amount;
    position.setXYZ(i, x + nx * d, y + ny * d, z + nz * d);
  }

  position.needsUpdate = true;
  normal.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * UV-aware variant of {@link displaceAlongNormals}.
 *
 * Some features are naturally expressed in surface coordinates rather than in
 * space: the annulation rings on a rhizome wrap *perpendicular to its own
 * growth direction*, which a swept path wanders away from, but is exactly
 * `constant v` in the sweep's UVs. Samplers receive (position, normal, u, v);
 * geometry without UVs gets zeros, which keeps every sampler total.
 */
export function displaceAlongNormalsUV(
  geometry: THREE.BufferGeometry,
  amount: number,
  sampler: (
    x: number,
    y: number,
    z: number,
    nx: number,
    ny: number,
    nz: number,
    u: number,
    v: number
  ) => number
): THREE.BufferGeometry {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  let normal = geometry.attributes.normal as THREE.BufferAttribute | undefined;
  const uv = geometry.attributes.uv as THREE.BufferAttribute | undefined;

  if (!normal) {
    geometry.computeVertexNormals();
    normal = geometry.attributes.normal as THREE.BufferAttribute;
  }

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);
    const u = uv ? uv.getX(i) : 0;
    const v = uv ? uv.getY(i) : 0;
    const d = sampler(x, y, z, nx, ny, nz, u, v) * amount;
    position.setXYZ(i, x + nx * d, y + ny * d, z + nz * d);
  }

  position.needsUpdate = true;
  normal.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Convenience: warp + fbm, the generic "organic surface" sampler. */
export function organicSampler(
  seed: number,
  opts: { warp?: number; warpFreq?: number; freq?: number; octaves?: number; ridge?: number } = {}
): DisplacementSampler {
  const {
    warp = 0.42,
    warpFreq = 2.1,
    freq = 4.2,
    octaves = 4,
    ridge = 0,
  } = opts;

  return (x, y, z) => {
    const [wx, wy, wz] = warp3(x * freq, y * freq, z * freq, seed, warp, warpFreq);
    const base = fbm3(wx, wy, wz, seed, { octaves });
    if (ridge === 0) return base;
    // Ridge term uses the un-warped position so creases stay crisp.
    const ridged = 1 - Math.abs(fbm3(x * freq * 1.9, y * freq * 1.9, z * freq * 1.9, seed + 977, {
      octaves: 3,
    }));
    return base * (1 - ridge) + (ridged * 2 - 1) * ridge;
  };
}

/* -------------------------------------------------------------------------- */
/* Parametric surfaces                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Builds a surface from a function of two parameters, with UVs where
 * `u` runs 0..1 across and `v` runs 0..1 down. The seam column is duplicated
 * (v = 1 repeats v = 0) so displacement can be applied later without tearing.
 */
export function parametricSurface(
  fn: (u: number, v: number) => Vec3,
  uSegments: number,
  vSegments: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= uSegments; i++) {
    const u = i / uSegments;
    for (let j = 0; j <= vSegments; j++) {
      const v = j / vSegments;
      const [x, y, z] = fn(u, v);
      positions.push(x, y, z);
      uvs.push(v, u);
    }
  }

  const rowLength = vSegments + 1;
  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const a = i * rowLength + j;
      const b = a + rowLength;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Growth rings: shallow, irregular annulations that wrap a rhizome segment
 * like the scars where a scale leaf was attached.
 *
 * Two modulations on top of a sine so the rings never read as machined
 * grooves: fbm jitters each ring's phase along its circumference, and a slow
 * drift in ring depth keeps neighbouring rings from looking identical. Values
 * stay in [-1, 1] so callers can add it to any displacement sampler.
 */
export function annulationRings(
  v: number,
  u: number,
  rings: number,
  seed: number
): number {
  const wobble = fbm3(u * 5.2, v * rings, 0.5, seed + 77, { octaves: 2 }) * 0.35;
  const ring = Math.sin((v * rings + wobble) * Math.PI * 2);
  const depthDrift = 0.75 + fbm3(v * 3.1, u * 1.3, 2.2, seed + 191, { octaves: 2 }) * 0.25;
  return ring * depthDrift;
}

/** Signed power used by superellipsoid profiles. */
function signedPow(v: number, e: number): number {
  return Math.sign(v) * Math.pow(Math.abs(v), e);
}

/**
 * Superellipsoid / ovoid. `e1` squares off the vertical profile, `e2` the
 * horizontal. A nutmeg is close to e1 = 0.85, e2 = 0.95 with a slight taper,
 * which is much closer to the real silhouette than an ellipsoid.
 */
export function superellipsoid(
  radii: Vec3,
  e1: number,
  e2: number,
  uSegments = 64,
  vSegments = 48,
  taper = 0
): THREE.BufferGeometry {
  const [a, b, c] = radii;

  return parametricSurface(
    (u, v) => {
      const lat = (u - 0.5) * Math.PI;
      const lon = v * Math.PI * 2;
      // Taper narrows one pole into the characteristic pointed tip.
      const t = 1 + taper * (u - 0.5);
      return [
        a * t * signedPow(Math.cos(lat), e1) * signedPow(Math.cos(lon), e2),
        b * t * signedPow(Math.cos(lat), e1) * signedPow(Math.sin(lon), e2),
        c * signedPow(Math.sin(lat), e1),
      ];
    },
    uSegments,
    vSegments
  );
}

/** Convenience sphere with useful segment counts for displacement. */
export function sphereGeometry(radius: number, segments = 64, rings = 48): THREE.BufferGeometry {
  return parametricSurface(
    (u, v) => {
      const theta = u * Math.PI;
      const phi = v * Math.PI * 2;
      return [
        radius * Math.sin(theta) * Math.cos(phi),
        radius * Math.cos(theta),
        radius * Math.sin(theta) * Math.sin(phi),
      ];
    },
    segments,
    rings
  );
}

/* -------------------------------------------------------------------------- */
/* Swept tubes                                                                */
/* -------------------------------------------------------------------------- */

export interface PathPoint {
  x: number;
  y: number;
  z: number;
  /** Cross-section scale at this point. */
  r: number;
}

/**
 * Sweeps a closed 2D profile along a 3D path using a parallel-transport frame.
 *
 * Parallel transport (rotating the previous frame by the minimal rotation into
 * the new tangent) avoids the twisting spikes you get from a naive
 * "cross(tangent, up)" frame wherever the path turns vertical.
 */
export function sweep(
  profile: THREE.Vector2[],
  path: PathPoint[],
  opts: {
    capStart?: boolean;
    capEnd?: boolean;
    roll?: (t: number) => number;
    /**
     * Explicit first-frame reference direction, Gram-Schmidt'd against the
     * first tangent. Without this the frame is seeded from whichever world axis
     * is least aligned to the tangent, which changes mid-path for planar curves
     * and rolls the whole cross-section 90 degrees.
     */
    upHint?: Vec3;
  } = {}
): THREE.BufferGeometry {
  const { capStart = true, capEnd = true, roll, upHint } = opts;
  const n = path.length;
  const m = profile.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  if (n < 2) throw new Error("sweep() needs at least two path points");

  const tangents: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(n - 1, i + 1)];
    const t = new THREE.Vector3(next.x - prev.x, next.y - prev.y, next.z - prev.z);
    if (t.lengthSq() < 1e-12) t.set(0, 1, 0);
    tangents.push(t.normalize());
  }

  // Seed the first frame: explicit hint if given, otherwise an axis least
  // aligned to the tangent.
  const first: THREE.Vector3 = upHint
    ? new THREE.Vector3(upHint[0], upHint[1], upHint[2])
        .addScaledVector(tangents[0], -new THREE.Vector3(upHint[0], upHint[1], upHint[2]).dot(tangents[0]))
        .normalize()
    : new THREE.Vector3().crossVectors(
        Math.abs(tangents[0].x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0),
        tangents[0]
      ).normalize();
  const normals: THREE.Vector3[] = [first];

  const rotation = new THREE.Quaternion();
  for (let i = 1; i < n; i++) {
    rotation.setFromUnitVectors(tangents[i - 1], tangents[i]);
    normals.push(normals[i - 1].clone().applyQuaternion(rotation).normalize());
  }

  for (let i = 0; i < n; i++) {
    const p = path[i];
    const tangent = tangents[i];
    const normal = normals[i];
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    const t = i / (n - 1);
    const theta = roll ? roll(t) : 0;
    const ct = Math.cos(theta);
    const st = Math.sin(theta);

    for (let j = 0; j < m; j++) {
      const px = profile[j].x;
      const py = profile[j].y;
      const rx = px * ct - py * st;
      const ry = px * st + py * ct;
      positions.push(
        p.x + (normal.x * rx + binormal.x * ry) * p.r,
        p.y + (normal.y * rx + binormal.y * ry) * p.r,
        p.z + (normal.z * rx + binormal.z * ry) * p.r
      );
      uvs.push(j / m, t);
    }
  }

  // Side walls. The profile is closed, so the last column stitches to the first.
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < m; j++) {
      const j2 = (j + 1) % m;
      const a = i * m + j;
      const b = (i + 1) * m + j;
      const c = (i + 1) * m + j2;
      const d = i * m + j2;
      indices.push(a, b, d, b, c, d);
    }
  }

  const capCount = (capStart ? 1 : 0) + (capEnd ? 1 : 0);
  if (capCount > 0) {
    // Caps are built as fans around the profile centroid.
    const makeCap = (i: number, flip: boolean) => {
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let j = 0; j < m; j++) {
        cx += positions[(i * m + j) * 3];
        cy += positions[(i * m + j) * 3 + 1];
        cz += positions[(i * m + j) * 3 + 2];
      }
      const centreIndex = positions.length / 3;
      positions.push(cx / m, cy / m, cz / m);
      uvs.push(0.5, 0.5);
      for (let j = 0; j < m; j++) {
        const j2 = (j + 1) % m;
        const a = i * m + j;
        const b = i * m + j2;
        if (flip) indices.push(centreIndex, b, a);
        else indices.push(centreIndex, a, b);
      }
    };
    if (capStart) makeCap(0, true);
    if (capEnd) makeCap(n - 1, false);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Round profile with a configurable segment count. */
export function circleProfile(segments = 20, radius = 1): THREE.Vector2[] {
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    profile.push(new THREE.Vector2(Math.cos(a) * radius, Math.sin(a) * radius));
  }
  return profile;
}

/** Flattened ellipse: ribbons, bark strips, a cashew's cross-section. */
export function ellipseProfile(a = 1, b = 0.5, segments = 20): THREE.Vector2[] {
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    profile.push(new THREE.Vector2(Math.cos(angle) * a, Math.sin(angle) * b));
  }
  return profile;
}

/**
 * A sausage/knob: a path with a radius that swells in the middle and tapers at
 * both ends, which is how essentially every dried rhizome node looks.
 */
export function taperedPath(
  from: Vec3,
  to: Vec3,
  radius: number,
  steps = 12,
  bulge = 1
): PathPoint[] {
  const points: PathPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const swell = Math.sin(Math.PI * t) ** 0.6;
    points.push({
      x: from[0] + (to[0] - from[0]) * t,
      y: from[1] + (to[1] - from[1]) * t,
      z: from[2] + (to[2] - from[2]) * t,
      // The swell is deliberately gentle. A taper that pinches to near-zero at
      // the ends turns a chain of connected segments into a string of beads,
      // because every joint ends up narrower than the segments either side.
      r: radius * (0.66 + 0.34 * swell) * bulge,
    });
  }
  return points;
}

export interface RhizomePaths {
  /**
   * The spine, as ONE continuous path.
   *
   * Building the spine as a chain of separately-swept segments is the mistake
   * that makes a rhizome look like a string of beads: each segment swells mid-way
   * and tapers at both ends, so every joint ends up narrower than the flesh on
   * either side of it, and the caps leave a visible seam. Sweeping the whole
   * spine in a single pass removes the seams entirely, so the only thing shaping
   * the silhouette is the radius profile.
   */
  axis: PathPoint[];
  /** Short knuckle fingers splaying off the spine. */
  fingers: PathPoint[][];
}

/**
 * Builds a rhizome: a fat, knuckled spine with splaying side fingers.
 *
 * Three things separate turmeric or ginger from a generic lumpy tube — the
 * spine wanders instead of running straight, each knuckle is short relative to
 * its own thickness, and the waist between knuckles is only *slightly* narrower
 * than the knuckle itself. That last point is what the pinch-to-near-zero taper
 * gets wrong: real dried rhizomes are segmented, not beaded.
 */
export function branchingRhizome(seed: number, knobs = 5, thickness = 1): RhizomePaths {
  const rand = mulberry32(seed);

  // Walk a wandering, upward-biased spine, recording the joint positions.
  const joints: { point: Vec3; radius: number }[] = [];
  let origin: Vec3 = [0, -0.24, 0];
  let direction: Vec3 = [0.18, 1, 0.06];
  joints.push({ point: origin, radius: (0.17 + rand() * 0.04) * thickness });

  const fingers: PathPoint[][] = [];

  for (let i = 0; i < knobs; i++) {
    // Short relative to the thickness, which is what gives a rhizome its
    // knuckled look rather than an elongated root look.
    const length = 0.1 + rand() * 0.06;
    const next: Vec3 = [
      origin[0] + direction[0] * length,
      origin[1] + direction[1] * length,
      origin[2] + direction[2] * length,
    ];
    joints.push({ point: next, radius: (0.175 + rand() * 0.05) * thickness });

    // Fingers emerge just behind the joint. The anchor is pulled back along the
    // spine so the finger tube starts *inside* the spine and the two intersect;
    // anchoring it on the surface instead leaves a visible seam at the join.
    const fingerCount = rand() > 0.4 ? 2 : 1;
    for (let k = 0; k < fingerCount; k++) {
      const azimuth = rand() * Math.PI * 2;
      const elevation = -0.2 + rand() * 0.9;
      const fingerLength = 0.1 + rand() * 0.085;
      const horizontal = Math.cos(elevation);
      const anchorT = -0.45;
      const anchor: Vec3 = [
        next[0] + direction[0] * length * anchorT,
        next[1] + direction[1] * length * anchorT,
        next[2] + direction[2] * length * anchorT,
      ];
      const tip: Vec3 = [
        anchor[0] + Math.cos(azimuth) * horizontal * fingerLength,
        anchor[1] + Math.sin(elevation) * fingerLength,
        anchor[2] + Math.sin(azimuth) * horizontal * fingerLength,
      ];
      fingers.push(taperedPath(anchor, tip, (0.115 + rand() * 0.03) * thickness, 12, 1));
    }

    // Wander. The upward bias is applied before normalising, so the spine still
    // drifts sideways but the clump never dives below its own base.
    direction = [
      direction[0] + (rand() - 0.5) * 1.2,
      direction[1] + (rand() - 0.5) * 0.4,
      direction[2] + (rand() - 0.5) * 1.2,
    ];
    direction[1] = Math.max(direction[1], 0.34);
    const dlen = Math.hypot(direction[0], direction[1], direction[2]) || 1;
    direction = [direction[0] / dlen, direction[1] / dlen, direction[2] / dlen];
    origin = next;
  }

  // Sample the spine continuously, applying the knuckle profile as we go. The
  // waist sits at the joints and the swell between them, with the waist kept at
  // 86% rather than pinched away.
  const axis: PathPoint[] = [];
  const substeps = 6;
  for (let i = 0; i < joints.length - 1; i++) {
    const from = joints[i];
    const to = joints[i + 1];
    for (let s = i === 0 ? 0 : 1; s <= substeps; s++) {
      const t = s / substeps;
      const waist = 0.86 + 0.14 * Math.sin(Math.PI * t);
      axis.push({
        x: from.point[0] + (to.point[0] - from.point[0]) * t,
        y: from.point[1] + (to.point[1] - from.point[1]) * t,
        z: from.point[2] + (to.point[2] - from.point[2]) * t,
        r: (from.radius + (to.radius - from.radius) * t) * waist,
      });
    }
  }

  return { axis, fingers };
}

/* -------------------------------------------------------------------------- */
/* Assembly                                                                   */
/* -------------------------------------------------------------------------- */

/** Merges geometries into one buffer, tolerating differing attribute sets. */
export function mergeAll(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const usable = geometries.filter((g) => g.attributes.position);
  if (usable.length === 0) throw new Error("mergeAll() received no positional geometry");

  for (const g of usable) {
    if (!g.attributes.uv) {
      const count = g.attributes.position.count;
      const uv = new Float32Array(count * 2);
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    }
  }

  const merged = mergeGeometries(
    usable.map((g) => g.toNonIndexed()),
    false
  );
  if (!merged) throw new Error("mergeGeometries() failed");
  merged.computeVertexNormals();
  return merged;
}

/**
 * Arranges `count` copies of a geometry as a small natural cluster: randomised
 * rotation, slight scale variation, no two touching at the same angle.
 */
export function cluster(
  geometry: THREE.BufferGeometry,
  count: number,
  seed: number,
  spread = 0.24
): THREE.BufferGeometry {
  if (count <= 1) return geometry;

  const rand = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];

  for (let i = 0; i < count; i++) {
    const copy = geometry.clone();
    const angle = (i / count) * Math.PI * 2 + rand() * 0.9;
    const radius = spread * (0.45 + rand() * 0.75);
    copy.rotateX(rand() * Math.PI);
    copy.rotateY(rand() * Math.PI);
    copy.rotateZ((rand() - 0.5) * 1.1);
    const s = 0.82 + rand() * 0.34;
    copy.scale(s, s, s);
    copy.translate(
      Math.cos(angle) * radius,
      (rand() - 0.5) * spread * 0.8,
      Math.sin(angle) * radius
    );
    parts.push(copy);
  }

  return mergeAll(parts);
}

/**
 * Signed volume of a closed mesh, via the divergence theorem.
 *
 * Positive means triangles wind counter-clockwise when seen from outside, which
 * is what front-face culling and lighting both assume.
 */
export function signedVolume(geometry: THREE.BufferGeometry): number {
  const position = geometry.attributes.position;
  const index = geometry.index;
  const triangles = index ? index.count / 3 : position.count / 3;
  let volume = 0;

  for (let t = 0; t < triangles; t++) {
    const ia = index ? index.getX(t * 3) : t * 3;
    const ib = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const ic = index ? index.getX(t * 3 + 2) : t * 3 + 2;

    const ax = position.getX(ia);
    const ay = position.getY(ia);
    const az = position.getZ(ia);
    const bx = position.getX(ib);
    const by = position.getY(ib);
    const bz = position.getZ(ib);
    const cx = position.getX(ic);
    const cy = position.getY(ic);
    const cz = position.getZ(ic);

    volume +=
      (ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)) / 6;
  }

  return volume;
}

/**
 * Guarantees outward-facing triangles.
 *
 * The winding a builder produces depends on the handedness of its
 * parametrisation, and a surface built inside-out is invisible with default
 * front-face culling. Rather than hand-tune the winding of every builder — and
 * re-tune it whenever one changes — measure the mesh and correct it once.
 *
 * Normals are deliberately NOT recomputed. Vertex normals belong to vertices,
 * not faces, so reordering the triangles (or permuting vertex blocks when the
 * geometry is not indexed) leaves every normal attached to the right vertex and
 * still pointing outward. Recomputing would flatten smooth surfaces into facets.
 */
export function ensureOutwardWinding(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  if (signedVolume(geometry) >= 0) return geometry;

  const index = geometry.index;
  if (index) {
    const array = index.array as Uint16Array | Uint32Array;
    for (let i = 0; i < array.length; i += 3) {
      const swap = array[i + 1];
      array[i + 1] = array[i + 2];
      array[i + 2] = swap;
    }
    index.needsUpdate = true;
  } else {
    for (const name of Object.keys(geometry.attributes)) {
      const attribute = geometry.attributes[name] as THREE.BufferAttribute;
      const itemSize = attribute.itemSize;
      const array = attribute.array as Float32Array;
      for (let vertex = 0; vertex + 2 < attribute.count; vertex += 3) {
        const second = (vertex + 1) * itemSize;
        const third = (vertex + 2) * itemSize;
        for (let k = 0; k < itemSize; k++) {
          const swap = array[second + k];
          array[second + k] = array[third + k];
          array[third + k] = swap;
        }
      }
      attribute.needsUpdate = true;
    }
  }

  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Replaces degenerate normals and re-normalises the rest.
 *
 * Poles and swept tips produce zero-area triangles, and a vertex whose every
 * adjacent face is degenerate ends up with a zero-length normal — which renders
 * as a black pinhole or NaN under any light. Falling back to the direction from
 * the centre is a good approximation for a specimen, which is convex-ish.
 */
export function repairNormals(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const normal = geometry.attributes.normal as THREE.BufferAttribute | undefined;
  if (!normal) return geometry;

  geometry.computeBoundingSphere();
  const centre = geometry.boundingSphere?.center ?? new THREE.Vector3();
  const itemSize = normal.itemSize;
  const array = normal.array as Float32Array;

  for (let i = 0; i < normal.count; i++) {
    const offset = i * itemSize;
    const length = Math.hypot(array[offset], array[offset + 1], array[offset + 2]);

    if (length < 1e-6) {
      let dx = position.getX(i) - centre.x;
      let dy = position.getY(i) - centre.y;
      let dz = position.getZ(i) - centre.z;
      const fallback = Math.hypot(dx, dy, dz);
      if (fallback < 1e-6) {
        dx = 0;
        dy = 1;
        dz = 0;
      } else {
        dx /= fallback;
        dy /= fallback;
        dz /= fallback;
      }
      array[offset] = dx;
      array[offset + 1] = dy;
      array[offset + 2] = dz;
    } else {
      array[offset] /= length;
      array[offset + 1] /= length;
      array[offset + 2] /= length;
    }
  }

  normal.needsUpdate = true;
  return geometry;
}

/**
 * Welds coincident vertices and recomputes normals.
 *
 * Swept tubes generate a lot of duplicate seam vertices. Welding them makes
 * displacement behave and roughly halves the vertex count, but it must happen
 * *before* displacement (so seams move together) and destroys UV seams, so it
 * is only safe on geometry whose UVs we accept losing at the seam.
 */
export function weld(geometry: THREE.BufferGeometry, tolerance = 1e-4): THREE.BufferGeometry {
  const merged = mergeVertices(geometry, tolerance);
  merged.computeVertexNormals();
  return merged;
}
