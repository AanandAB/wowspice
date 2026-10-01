import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { fbm3, mulberry32, valueNoise3, worley3, warp3 } from "@/lib/three/noise";
import { SPECIMEN_RECIPES, recipeFor, type SpecimenId } from "@/lib/three/recipes";
import { buildSpecimenGeometry } from "@/lib/three/geometry/specimens";

const IDS = Object.keys(SPECIMEN_RECIPES) as SpecimenId[];

describe("noise", () => {
  it("is deterministic for a given seed", () => {
    expect(valueNoise3(1.3, 2.7, 0.4, 42)).toBe(valueNoise3(1.3, 2.7, 0.4, 42));
    expect(fbm3(1.3, 2.7, 0.4, 42)).toBe(fbm3(1.3, 2.7, 0.4, 42));
  });

  it("differs between seeds", () => {
    expect(valueNoise3(1.3, 2.7, 0.4, 42)).not.toBe(valueNoise3(1.3, 2.7, 0.4, 43));
  });

  it("stays inside [-1, 1]", () => {
    for (let i = 0; i < 400; i++) {
      const v = valueNoise3(i * 0.37, i * 0.11 + 3, i * 0.77, 7);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("orders worley distances f1 <= f2, which the reticulation depends on", () => {
    for (let i = 0; i < 200; i++) {
      const { f1, f2 } = worley3(i * 0.13, i * 0.29, i * 0.07, 11);
      expect(f1).toBeLessThanOrEqual(f2);
    }
  });

  it("warps positions by roughly the requested amplitude", () => {
    const [wx] = warp3(0.5, 0.5, 0.5, 3, 0.2, 1.5);
    expect(Math.abs(wx - 0.5)).toBeLessThanOrEqual(0.2 + 1e-9);
  });

  it("produces a repeatable PRNG stream", () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });
});

describe("recipe table", () => {
  it("covers all eleven spices", () => {
    expect(IDS).toHaveLength(11);
  });

  it("has a distinct seed per spice, so no two specimens share a surface", () => {
    const seeds = new Set(IDS.map((id) => SPECIMEN_RECIPES[id].material.seed));
    expect(seeds.size).toBe(IDS.length);
  });

  it("keeps material parameters inside physically sensible ranges", () => {
    for (const id of IDS) {
      const { material } = SPECIMEN_RECIPES[id];
      expect(material.roughness).toBeGreaterThan(0);
      expect(material.roughness).toBeLessThanOrEqual(1);
      expect(material.normalScale).toBeGreaterThan(0);
      expect(material.aoStrength).toBeGreaterThanOrEqual(0);
      expect(material.aoStrength).toBeLessThanOrEqual(1);
      expect(material.features.length).toBeGreaterThan(0);
      for (const feature of material.features) {
        expect(feature.scale).toBeGreaterThan(0);
        expect(feature.amp).toBeGreaterThan(0);
      }
    }
  });

  it("throws a useful error for an unknown id", () => {
    expect(() => recipeFor("coriander")).toThrow(/No specimen recipe/);
  });

  it("keeps sheen, when present, inside the subtle range", () => {
    for (const id of IDS) {
      // recipeFor() returns the SpecimenRecipe interface, where optional fields
      // stay optional; the literal SPECIMEN_RECIPES union only exposes keys
      // every member declares.
      const sheen = recipeFor(id).material.sheen;
      if (sheen !== undefined) {
        expect(sheen).toBeGreaterThan(0);
        // Past ~0.35 every surface starts reading as velvet upholstery.
        expect(sheen).toBeLessThanOrEqual(0.35);
      }
    }
  });

  it("gives every feature tint a valid hex colour", () => {
    for (const id of IDS) {
      for (const feature of recipeFor(id).material.features) {
        if (feature.tint !== undefined) {
          expect(feature.tint).toMatch(/^#[0-9a-f]{6}$/i);
        }
      }
    }
  });

  it("keeps feature regions on the body", () => {
    for (const id of IDS) {
      for (const feature of recipeFor(id).material.features) {
        if (feature.region) {
          expect(feature.region.base).toBeGreaterThanOrEqual(0);
          expect(feature.region.base).toBeLessThanOrEqual(1);
          expect(feature.region.falloff).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("geometry builders", () => {
  // This is the highest-value test here: a NaN or an empty buffer makes a
  // specimen silently invisible in the browser, which is far cheaper to catch
  // here than in a screenshot.
  for (const id of IDS) {
    describe(id, () => {
      const geometry = buildSpecimenGeometry(SPECIMEN_RECIPES[id].geometry);

      it("produces vertices", () => {
        expect(geometry.attributes.position).toBeDefined();
        expect(geometry.attributes.position.count).toBeGreaterThan(100);
      });

      it("has a UV channel, without which the texture maps are meaningless", () => {
        expect(geometry.attributes.uv).toBeDefined();
        expect(geometry.attributes.uv.count).toBe(geometry.attributes.position.count);
      });

      it("has normals", () => {
        expect(geometry.attributes.normal).toBeDefined();
        expect(geometry.attributes.normal.count).toBe(geometry.attributes.position.count);
      });

      it("contains no NaN or Infinity", () => {
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i++) {
          expect(Number.isFinite(positions[i])).toBe(true);
        }
      });

      it("has unit-length normals", () => {
        const normals = geometry.attributes.normal.array;
        // Sample rather than walk every vertex; the surfaces are dense.
        for (let i = 0; i < normals.length; i += 3 * 97) {
          const length = Math.hypot(normals[i], normals[i + 1], normals[i + 2]);
          expect(length).toBeGreaterThan(0.9);
          expect(length).toBeLessThan(1.1);
        }
      });

      it("fits a sane bounding size, so nothing fills or vanishes from the frame", () => {
        geometry.computeBoundingSphere();
        const radius = geometry.boundingSphere?.radius ?? 0;
        expect(radius).toBeGreaterThan(0.2);
        expect(radius).toBeLessThan(1.2);
      });

      it("has a positive volume, so the winding is not inside out", () => {
        // Signed volume via the divergence theorem over the triangles.
        const index = geometry.index;
        const position = geometry.attributes.position;
        const get = (i: number): [number, number, number] => [
          position.getX(i),
          position.getY(i),
          position.getZ(i),
        ];
        let volume = 0;
        const triangles = index ? index.count / 3 : position.count / 3;
        for (let t = 0; t < triangles; t++) {
          const [ia, ib, ic] = index
            ? [index.getX(t * 3), index.getX(t * 3 + 1), index.getX(t * 3 + 2)]
            : [t * 3, t * 3 + 1, t * 3 + 2];
          const a = get(ia);
          const b = get(ib);
          const c = get(ic);
          volume +=
            (a[0] * (b[1] * c[2] - b[2] * c[1]) -
              a[1] * (b[0] * c[2] - b[2] * c[0]) +
              a[2] * (b[0] * c[1] - b[1] * c[0])) /
            6;
        }
        expect(volume).toBeGreaterThan(0);
      });
    });
  }
});

describe("geometry determinism", () => {
  it("rebuilds byte-identically, so the cache key is trustworthy", () => {
    const spec = SPECIMEN_RECIPES.nutmeg.geometry;
    const first = buildSpecimenGeometry(spec).attributes.position.array;
    const second = buildSpecimenGeometry(spec).attributes.position.array;
    expect(first.length).toBe(second.length);
    for (let i = 0; i < first.length; i += 331) {
      expect(first[i]).toBe(second[i]);
    }
  });
});

describe("dispose safety", () => {
  it("can be disposed without throwing", () => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0], 3));
    expect(() => geometry.dispose()).not.toThrow();
  });
});
