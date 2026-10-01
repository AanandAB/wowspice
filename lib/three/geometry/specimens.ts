import * as THREE from "three";
import { clamp01, fbm3, mulberry32, smoothstepRange, worley3 } from "../noise";
import type { GeometrySpec } from "../recipes";
import {
  annulationRings,
  branchingRhizome,
  circleProfile,
  cluster,
  displaceAlongNormals,
  displaceAlongNormalsUV,
  ellipseProfile,
  ensureOutwardWinding,
  mergeAll,
  organicSampler,
  parametricSurface,
  repairNormals,
  sphereGeometry,
  superellipsoid,
  sweep,
  weld,
  type PathPoint,
} from "./primitives";

/**
 * One builder per spice. Each returns geometry roughly 0.5–0.7 units across so
 * the camera framing is consistent between specimens.
 *
 * The detail budget has been pushed up from the first pass: these specimens
 * double as product photography, and the recognisable anatomy — a cardamom's
 * three valves, turmeric's growth rings, mace's branching lace, the socket in a
 * dried kudampuli — only survives displacement on a sufficiently dense hull.
 */

/** Scales a geometry so its bounding sphere has the requested radius. */
function fitToScale(geometry: THREE.BufferGeometry, targetRadius: number): THREE.BufferGeometry {
  geometry.computeBoundingSphere();
  const radius = geometry.boundingSphere?.radius ?? 1;
  if (radius > 0) {
    const s = targetRadius / radius;
    geometry.scale(s, s, s);
  }
  geometry.computeBoundingSphere();
  return geometry;
}

/* -------------------------------------------------------------------------- */

function buildPeppercorn(spec: GeometrySpec): THREE.BufferGeometry {
  // A peppercorn is a sphere whose whole identity is its wrinkled, dimpled
  // skin — plus two features a bare sphere misses: the tiny beak where the
  // style sat, and the paler, flattened hilum where the berry attached to the
  // spike. Both are single features, so they are painted with smooth bumps
  // rather than noise.
  const geometry = sphereGeometry(0.5, 96, 76);
  geometry.scale(1, 0.94, 0.99);

  displaceAlongNormals(
    geometry,
    spec.displacement,
    organicSampler(spec.seed, { freq: 7.5, octaves: 4, ridge: 0.45, warp: 0.55, warpFreq: 2.4 })
  );

  // Style beak: a small smooth bump at +Y, before the pole is tilted away.
  displaceAlongNormals(geometry, 0.045, (_x, y, _z, _nx, ny) =>
    Math.pow(clamp01((y - 0.32) / 0.18), 1.6) * (ny > 0 ? 1 : 0)
  );

  // Attachment hilum: a shallow flattened disc low on one flank.
  displaceAlongNormals(geometry, 0.03, (x, y, z) => {
    const dx = x - 0.24;
    const dy = y + 0.3;
    const dz = z - 0.14;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return Math.exp(-dist * dist * 210) * 0.7;
  });

  fitToScale(geometry, 0.5);
  // A sphere's UV mapping has a singularity at each pole, so the texture
  // pinches to a starburst there. Tilt the berry so neither pole faces camera.
  geometry.rotateX(0.42);
  geometry.rotateZ(0.28);
  geometry.computeBoundingSphere();
  return geometry;
}

function buildSpindlePod(spec: GeometrySpec): THREE.BufferGeometry {
  // Cardamom: a tri-lobed capsule with a beak and a distinct rim where the
  // three valves meet. The lobes are cut into the *cross-section* rather than
  // painted on, so the silhouette is unmistakable from any angle.
  const geometry = parametricSurface(
    (u, v) => {
      const lat = (u - 0.5) * Math.PI;
      const lon = v * Math.PI * 2;
      // Radius swells through the middle and pinches at both tips.
      const r = Math.pow(Math.max(0, Math.cos(lat)), 0.72);
      const beak = u < 0.04 ? 1.5 : 1; // small stalk point at the wide end
      // Three valves: radial wobble in the cross-section itself.
      const lobe = 1 + 0.075 * Math.cos(lon * 3) - 0.02 * Math.cos(lon * 6);
      return [
        r * Math.cos(lon) * 0.2 * lobe * beak,
        Math.sin(lat) * 0.5,
        r * Math.sin(lon) * 0.2 * lobe * beak,
      ];
    },
    96,
    64
  );

  displaceAlongNormals(geometry, spec.displacement, (x, y, z) => {
    const theta = Math.atan2(z, x);
    // Amplitude tapers to nothing at the poles, where atan2 has no meaning and
    // would otherwise smear the ribs into a starburst.
    const t = clamp01((y / 0.5 + 1) / 2);
    const taper = Math.pow(Math.sin(Math.PI * t), 0.35);
    // Valve creases aligned with the lobes, plus fine striations between them.
    const crease = Math.cos(theta * 3) * 1.9;
    const fine = Math.cos(theta * 18) * 1.3;
    const micro = fbm3(x * 70, y * 70, z * 70, spec.seed, { octaves: 3 });
    return (crease + fine) * taper + micro * 0.9;
  });

  return fitToScale(geometry, 0.55);
}

function buildRolledQuill(spec: GeometrySpec): THREE.BufferGeometry {
  // Cinnamon is a bark strip rolled into a quill, so the cross-section is a
  // spiral and the ends genuinely show the layers. Built by sweeping a
  // rectangular profile (axial height x radial thickness) along a spiral path.
  const turns = 2.4;
  const rInner = 0.09;
  const rOuter = 0.3;
  const thickness = 0.022;
  // The axial extent of the bark strip. Kept short relative to the roll diameter
  // so the quill reads as a stubby rolled stick rather than a fence post, and so
  // that tilting it still shows the spiral end.
  const quillHeight = 0.62;

  const path: PathPoint[] = [];
  const steps = 280;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = t * Math.PI * 2 * turns;
    const radius = rInner + (rOuter - rInner) * Math.pow(t, 0.92);
    // The outer wrap is ragged where the bark tore when it was peeled.
    const ragged = 1 + fbm3(t * 9, 0, 0, spec.seed + 31, { octaves: 2 }) * 0.1;
    path.push({
      x: Math.cos(theta) * radius,
      y: 0,
      z: Math.sin(theta) * radius,
      r: ragged,
    });
  }

  const rectangle: THREE.Vector2[] = [
    new THREE.Vector2(-quillHeight / 2, -thickness),
    new THREE.Vector2(quillHeight / 2, -thickness),
    new THREE.Vector2(quillHeight / 2, thickness),
    new THREE.Vector2(-quillHeight / 2, thickness),
  ];

  const geometry = sweep(rectangle, path, {
    upHint: [0, 1, 0],
    capStart: true,
    capEnd: true,
  });

  displaceAlongNormals(
    geometry,
    spec.displacement,
    organicSampler(spec.seed, { freq: 26, octaves: 3, ridge: 0.3, warp: 0.35, warpFreq: 4 })
  );

  // Stand the quill on a diagonal. Straight-on, a rolled quill is just a
  // cylinder; tilted, you can see the spiral layers in the cut end, which is the
  // whole reason quills are sold whole.
  geometry.rotateZ(1.02);
  geometry.rotateY(-0.55);

  return fitToScale(geometry, 0.52);
}

function buildRhizome(spec: GeometrySpec, fibrous: boolean): THREE.BufferGeometry {
  // Ginger is a thinner, more shrivelled root with more knuckles; turmeric is a
  // plumper finger with fewer, fatter ones.
  const { axis, fingers } = branchingRhizome(
    spec.seed,
    fibrous ? 7 : 5,
    fibrous ? 0.9 : 1.14
  );
  const profile = circleProfile(20);

  const parts: THREE.BufferGeometry[] = [
    sweep(profile, axis, { capStart: true, capEnd: true }),
    ...fingers.map((finger) => sweep(profile, finger, { capStart: true, capEnd: true })),
  ];

  const geometry = fitToScale(mergeAll(parts), 0.52);

  // Growth rings: shallow annulations wrapping perpendicular to each swept
  // tube's own axis. These are exactly `constant v` in the sweep UVs, which is
  // why the displacement runs in UV space rather than world space — a world-
  // space ring would smear as the spine wanders.
  const ringFreq = fibrous ? 5.5 : 4;
  const organic = organicSampler(spec.seed, {
    freq: fibrous ? 11 : 8,
    octaves: 4,
    // Ginger is fibrous and shrivelled; turmeric is plumper and smoother.
    ridge: fibrous ? 0.68 : 0.42,
    warp: fibrous ? 0.4 : 0.6,
    warpFreq: 2.6,
  });
  displaceAlongNormalsUV(geometry, spec.displacement * 0.85, (x, y, z, nx, ny, nz, u, v) => {
    const rings = annulationRings(v, u, ringFreq, spec.seed);
    // Ginger keeps strong ring scars; turmeric's are gentler — on the plump
    // finger a full-strength ring reads as machined banding.
    return rings * (fibrous ? 0.85 : 0.55) + organic(x, y, z, nx, ny, nz);
  });

  return geometry;
}

function buildNutmegOvoid(spec: GeometrySpec): THREE.BufferGeometry {
  // The defining feature is reticulation: a fine net of raised lines over a
  // near-ovoid kernel, plus a subtle longitudinal lobe division.
  const geometry = superellipsoid([0.36, 0.5, 0.36], 0.92, 0.96, 80, 60, 0.06);

  displaceAlongNormals(geometry, spec.displacement, (x, y, z) => {
    const { f1, f2 } = worley3(x * 10.5, y * 10.5, z * 10.5, spec.seed);
    // f2 - f1 collapses to zero along cell boundaries = the raised net.
    const net = 1 - clamp01((f2 - f1) / 0.55);
    const micro = fbm3(x * 38, y * 38, z * 38, spec.seed + 61, { octaves: 3 });
    // Faint vertical lobing: real nutmegs are slightly angular, not round.
    const theta = Math.atan2(z, x);
    const lobes = Math.cos(theta * 4) * 0.22;
    return net * 1.5 + micro * 0.5 + lobes;
  });

  fitToScale(geometry, 0.5);
  // Same pole-singularity reasoning as the peppercorn.
  geometry.rotateX(0.34);
  geometry.rotateZ(-0.3);
  geometry.computeBoundingSphere();
  return geometry;
}

function buildMaceAril(spec: GeometrySpec): THREE.BufferGeometry {
  // Mace is the lacy aril wrapped around the nutmeg. The first pass drew
  // parallel lobes, which reads as a ribbed cocoon; real mace *branches*, so
  // each primary strand now spawns 1–2 side branches partway down its run, and
  // the strand width pinches to a thread at both ends.
  const rand = mulberry32(spec.seed);
  const ribbon = ellipseProfile(1, 0.3, 10);
  const parts: THREE.BufferGeometry[] = [];

  const strands = 7;
  for (let i = 0; i < strands; i++) {
    const phi0 = (i / strands) * Math.PI * 2 + rand() * 0.3;
    const steps = 46;

    const makeStrand = (phiStart: number, width: number): PathPoint[] => {
      const path: PathPoint[] = [];
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const lat = (t - 0.5) * Math.PI * 0.93;
        const wander = Math.sin(t * Math.PI * 2.4 + i * 1.7) * 0.26;
        const phi = phiStart + wander;
        const radius = 0.44 * (1 + Math.sin(t * Math.PI * 5.1 + i) * 0.05);
        // Pinch to a thread at the tips: lace, not rope.
        const taper = Math.pow(Math.sin(Math.PI * clamp01(t * 1.04)), 0.42);
        path.push({
          x: radius * Math.cos(lat) * Math.cos(phi),
          y: radius * Math.sin(lat) * 1.02,
          z: radius * Math.cos(lat) * Math.sin(phi),
          r: (0.02 + taper * width) * (1 + Math.sin(t * Math.PI * 7 + i * 2) * 0.12),
        });
      }
      return path;
    };

    const primaryWidth = 0.05 + rand() * 0.07;
    parts.push(sweep(ribbon, makeStrand(phi0, primaryWidth), { capStart: true, capEnd: true }));

    // Side branches fork off mid-strand, angling toward the gaps.
    const branchCount = rand() > 0.45 ? 2 : 1;
    for (let k = 0; k < branchCount; k++) {
      const forkT = 0.3 + rand() * 0.4;
      const lat = (forkT - 0.5) * Math.PI * 0.93;
      const wander = Math.sin(forkT * Math.PI * 2.4 + i * 1.7) * 0.26;
      const radius = 0.44 * (1 + Math.sin(forkT * Math.PI * 5.1 + i) * 0.05);
      const forkPhi = phi0 + wander + (rand() > 0.5 ? 0.55 : -0.55);
      const anchor: Vec3Tuple = [
        radius * Math.cos(lat) * Math.cos(phi0 + wander),
        radius * Math.sin(lat) * 1.02,
        radius * Math.cos(lat) * Math.sin(phi0 + wander),
      ];
      // The branch runs from the fork point to a fresh point higher up,
      // guaranteeing the two tubes intersect rather than float apart.
      const endT = clamp01(forkT + 0.22 + rand() * 0.2);
      const endLat = (endT - 0.5) * Math.PI * 0.93;
      const endRadius = 0.44 * (1 + Math.sin(endT * Math.PI * 5.1 + i) * 0.05);
      const tip: Vec3Tuple = [
        endRadius * Math.cos(endLat) * Math.cos(forkPhi),
        endRadius * Math.sin(endLat) * 1.02,
        endRadius * Math.cos(endLat) * Math.sin(forkPhi),
      ];
      const branch = taperedSweepPath(anchor, tip, 0.028 + rand() * 0.02, 14);
      parts.push(sweep(ribbon, branch, { capStart: true, capEnd: true }));
    }
  }

  // The kernel the aril wraps around.
  parts.push(fitToScale(superellipsoid([0.34, 0.42, 0.34], 0.95, 0.98, 48, 36), 0.42));

  const geometry = fitToScale(mergeAll(parts), 0.58);

  displaceAlongNormals(
    geometry,
    spec.displacement * 0.6,
    organicSampler(spec.seed, { freq: 16, octaves: 3, ridge: 0.5, warp: 0.5, warpFreq: 3.2 })
  );

  return geometry;
}

/** A gently swelling tube between two points, for mace branches. */
function taperedSweepPath(
  from: Vec3Tuple,
  to: Vec3Tuple,
  radius: number,
  steps: number
): PathPoint[] {
  const points: PathPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const swell = Math.sin(Math.PI * t) ** 0.55;
    points.push({
      x: from[0] + (to[0] - from[0]) * t,
      y: from[1] + (to[1] - from[1]) * t,
      z: from[2] + (to[2] - from[2]) * t,
      r: radius * (0.55 + 0.45 * swell),
    });
  }
  return points;
}

type Vec3Tuple = [number, number, number];

/**
 * A cashew, in or out of its shell.
 *
 * Two earlier passes failed here. A constant-radius sweep with end caps made a
 * curved sausage with two flat cuts; deforming a sphere made a garlic clove —
 * a pointy-bottomed blob that reads wrong from every angle. The fix is to make
 * closure a property of the *radius profile*: a tube swept along a circular
 * arc whose cross-section follows a sine-power, so both ends taper smoothly to
 * rounded tips and the body stays widest just past the middle. Closing by
 * profile rather than by cap means no sliced ends, and keeping the widest ring
 * fat means no clove point.
 */
function buildCashew(spec: GeometrySpec, shell: boolean): THREE.BufferGeometry {
  // An arc of ~150 degrees, swept in the XZ plane. The concave face — where a
  // kernel's seam runs — ends up facing +Z. Proportions follow a real kernel:
  // length-to-width around 2.3:1, which is much plumper than it looks in a
  // pile — slender bodies is exactly what read as a worm in the last pass.
  // 84 path steps x 28 profile segments: the cross-section polygon must be
  // dense enough that smooth normals shade without visible facets — under this
  // raking key light a 20-gon cross-section bands like croissant lamination.
  const steps = 84;
  const sweepAngle = Math.PI * 0.84;
  const arcRadius = shell ? 0.3 : 0.325;
  const path: PathPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = -sweepAngle / 2 + sweepAngle * t;
    // Profile: closing smoothly at both tips (no caps visible), with a high
    // exponent so the tips stay blunt — sin^0.8 stays fat until close to the
    // end, where it rounds off instead of spiking.
    const profile = Math.pow(Math.sin(Math.PI * t), shell ? 0.78 : 0.82);
    const maxR = shell ? 0.165 : 0.19;
    path.push({
      x: Math.cos(a) * arcRadius,
      y: 0,
      z: Math.sin(a) * arcRadius,
      r: maxR * profile,
    });
  }

  // Cross-sections: the kernel is slightly taller than wide; the shell runs
  // rounder and a little flattened, as if pressed.
  const profile = ellipseProfile(1, shell ? 0.88 : 1.15, 28);
  const geometry = sweep(profile, path, { capStart: true, capEnd: true, upHint: [0, 1, 0] });

  // Surface frequency matters here: too high and the body reads as segmented,
  // like a caterpillar. Kernel skin is smooth with long shallow undulations.
  const organic = shell
    ? organicSampler(spec.seed, { freq: 10, octaves: 4, ridge: 0.45, warp: 0.45, warpFreq: 3 })
    : organicSampler(spec.seed, { freq: 12, octaves: 3, ridge: 0.12, warp: 0.3, warpFreq: 2.4 });

  // Features are expressed in the tube's own frame: azimuth around the
  // cross-section (0 at the inner, concave meridian) and arc position t, so
  // they follow the bend instead of cutting across it.
  displaceAlongNormals(
    geometry,
    shell ? spec.displacement : spec.displacement * 0.9,
    (x, y, z, nx, ny, nz) => {
      const organicTerm = organic(x, y, z, nx, ny, nz);

      const phi = Math.atan2(z, x);
      const radialX = Math.cos(phi);
      const radialZ = Math.sin(phi);
      const ox = x - radialX * arcRadius;
      const oz = z - radialZ * arcRadius;
      // Depth toward the arc centre is positive on the concave face.
      const rIn = -(ox * radialX + oz * radialZ);
      const azimuth = Math.atan2(y, rIn);
      const t = clamp01((phi + sweepAngle / 2) / sweepAngle);
      const tipFade = Math.pow(Math.sin(Math.PI * t), 0.6);

      if (shell) {
        // Five lengthwise ridges over the pebbled shell.
        const ridges = Math.cos(azimuth * 5) * 0.55;
        return organicTerm + ridges * 0.6 * tipFade;
      }
      // The kernel's seam: a shallow, wide groove along the inner meridian.
      // Deep and narrow read as a crack; wide and soft read as the seam.
      const seam = -Math.exp(-(azimuth * azimuth) / 0.5);
      return organicTerm + seam * 0.6 * tipFade;
    }
  );

  return fitToScale(geometry, shell ? 0.5 : 0.46);
}

function buildLongPod(spec: GeometrySpec): THREE.BufferGeometry {
  // Tamarind: a bowed, slightly irregular pod whose skin is drawn in *between*
  // the seeds. The bulges are per-seed Gaussian bumps in the spine radius
  // itself, so the silhouette and the surface agree by construction — the old
  // version put cosine lumps in the path and different-frequency lumps in the
  // displacement, and the two cancelled into an unreal segmented tube.
  const path: PathPoint[] = [];
  const steps = 72;
  const seedCount = 6;
  const rand = mulberry32(spec.seed);

  // Each seed sits at a jittered position with its own strength, which breaks
  // the machined regularity of a plain cosine chain.
  const seedTs: number[] = [];
  const seedAmps: number[] = [];
  for (let s = 0; s < seedCount; s++) {
    seedTs.push((s + 0.5) / seedCount + (rand() - 0.5) * 0.06);
    seedAmps.push(0.06 + rand() * 0.035);
  }
  const seedBump = (t: number): number => {
    let sum = 0;
    for (let s = 0; s < seedCount; s++) {
      const d = (t - seedTs[s]) / 0.085;
      sum += Math.exp(-d * d) * seedAmps[s];
    }
    return sum;
  };

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // A lazy S wander plus the main bow, both gentle.
    path.push({
      x: 0.045 * Math.sin(t * Math.PI * 1.7),
      y: (t - 0.5) * 0.9,
      z: 0.11 * Math.sin(t * Math.PI),
      r: 0.175 * (0.55 + 0.75 * Math.pow(Math.sin(Math.PI * t), 0.5)) + seedBump(t),
    });
  }

  const geometry = sweep(ellipseProfile(1, 0.86, 22), path, { capStart: true, capEnd: true });
  fitToScale(geometry, 0.62);

  displaceAlongNormals(geometry, spec.displacement, (x, y, z) => {
    // Fine lengthwise wrinkles: fibres under the skin run pod-length, so the
    // noise is stretched hard along y.
    const fibres = 1 - Math.abs(fbm3(x * 26, y * 4.5, z * 26, spec.seed, { octaves: 3 }));
    const skin = fbm3(x * 16, y * 22, z * 16, spec.seed + 313, { octaves: 3 });
    return (fibres * 2 - 1) * 0.55 + skin * 0.45;
  });

  return geometry;
}

function buildWrinkledRind(spec: GeometrySpec): THREE.BufferGeometry {
  // Kudampuli is not a shrivelled ball: it is a flattened berry, halved and
  // gutted, so the dried rind is a low dome with radial fluting and a deep
  // concave socket with a raised rim on one face. Getting the *form* right
  // matters more than the shrivel texture on top of it.
  const body = sphereGeometry(0.46, 96, 76);
  body.scale(1, 0.58, 0.94);

  displaceAlongNormals(body, spec.displacement, (x, y, z, nx, ny, nz) => {
    const organic = organicSampler(spec.seed, {
      freq: 5.2,
      octaves: 5,
      ridge: 0.72,
      warp: 0.7,
      warpFreq: 2.0,
    })(x, y, z, nx, ny, nz);
    // Pumpkin-style radial lobing, strongest around the equator and fading at
    // the flattened poles. A jittered phase keeps the flutes from reading as
    // machined pleats.
    const theta = Math.atan2(z, x);
    const phase = fbm3(x * 3.1, y * 3.1, z * 3.1, spec.seed + 55, { octaves: 2 }) * 0.55;
    const latitudeFade = Math.pow(Math.cos(clamp01(y / 0.27) * Math.PI * 0.5), 0.8);
    const flutes = Math.cos(theta * 7 + phase) * 0.34 * latitudeFade;
    return organic + flutes;
  });

  // The socket: a deep gaussian pit with a raised rim around it, pressed into
  // the upper face where the default camera (slightly overhead) sees it.
  displaceAlongNormals(body, 0.16, (x, y, z) => {
    const dx = x;
    const dy = y - 0.24;
    const dz = z + 0.03;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const pit = -Math.exp(-(dist * dist) / 0.028) * 1.15;
    const rimD = dist - 0.24;
    const rim = Math.exp(-(rimD * rimD) / 0.0035) * 0.4;
    return pit + rim;
  });

  // A stubby stem, because every dried rind in a sack still has one.
  const stem = sweep(
    circleProfile(10),
    [
      { x: 0, y: 0.24, z: 0.03, r: 0.05 },
      { x: 0.014, y: 0.3, z: 0.038, r: 0.037 },
      { x: 0.02, y: 0.35, z: 0.042, r: 0.02 },
    ],
    { capStart: true, capEnd: true }
  );

  return fitToScale(mergeAll([body, stem]), 0.5);
}

/* -------------------------------------------------------------------------- */

export function buildSpecimenGeometry(spec: GeometrySpec): THREE.BufferGeometry {
  let base: THREE.BufferGeometry;

  switch (spec.kind) {
    case "peppercorn":
      base = buildPeppercorn(spec);
      break;
    case "spindlePod":
      base = buildSpindlePod(spec);
      break;
    case "rolledQuill":
      base = buildRolledQuill(spec);
      break;
    case "rhizome":
      base = buildRhizome(spec, false);
      break;
    case "gingerRoot":
      base = buildRhizome(spec, true);
      break;
    case "nutmegOvoid":
      base = buildNutmegOvoid(spec);
      break;
    case "maceAril":
      base = buildMaceAril(spec);
      break;
    case "reniformShell":
      base = buildCashew(spec, true);
      break;
    case "kernel":
      base = buildCashew(spec, false);
      break;
    case "longPod":
      base = buildLongPod(spec);
      break;
    case "wrinkledRind":
      base = buildWrinkledRind(spec);
      break;
    default:
      base = sphereGeometry(0.5, 48, 36);
  }

  if (spec.copies && spec.copies > 1) {
    base = cluster(base, spec.copies, spec.seed, spec.spread ?? 0.3);
    // mergeAll() collapses to non-indexed triangles, so every vertex now owns
    // a flat face normal and clustered specimens shade as low polygons. Weld
    // re-merges coincident positions (respecting the UV seam so maps stay
    // aligned) and recomputes smooth normals — this is why a single kernel
    // looked smooth while the cluster looked chiselled.
    base = weld(base);
  }

  // Final pass, applied uniformly to every specimen so that no individual
  // builder can ship an inside-out or pinholed surface. A surface built
  // inside-out is simply invisible with default front-face culling, which is a
  // very expensive bug to find from a screenshot.
  ensureOutwardWinding(base);
  repairNormals(base);
  base.computeBoundingSphere();

  return base;
}
