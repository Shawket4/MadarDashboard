import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { DURATION, EASE, staggerFor, STAGGER, swapStaggerFor } from "./tokens";

const css = readFileSync(resolve(__dirname, "motion.css"), "utf8");

function cssVar(name: string): string {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`motion.css has no --${name}`);
  return m[1].trim();
}

const bezier = (pts: readonly number[]) => `cubic-bezier(${pts.join(", ")})`;

describe("motion tokens: CSS mirrors TypeScript", () => {
  it.each(Object.entries(DURATION))("--motion-%s", (name, ms) => {
    expect(cssVar(`motion-${name}`)).toBe(`${ms}ms`);
  });

  it("ease-in-out is the inOut curve", () => {
    expect(cssVar("ease-in-out")).toBe(bezier(EASE.inOut));
  });

  it.each(Object.entries(EASE).filter(([n]) => n !== "inOut"))("--ease-%s", (name, pts) => {
    expect(cssVar(`ease-${name}`)).toBe(bezier(pts));
  });

  it("bare transitions use the fast duration and the out curve", () => {
    expect(cssVar("default-transition-duration")).toBe(`${DURATION.fast}ms`);
    expect(cssVar("default-transition-timing-function")).toBe(bezier(EASE.out));
  });
});

describe("staggerFor", () => {
  it("is zero for one item", () => expect(staggerFor(1)).toBe(0));
  it("keeps the register's step for short lists", () => expect(staggerFor(4)).toBe(STAGGER.product));
  it("caps the whole run however long the list", () => {
    const each = staggerFor(500, "brand");
    expect(each * (STAGGER.maxItems - 1)).toBeLessThanOrEqual(STAGGER.maxTotal + 1e-9);
  });
  it("lands a whole product group within its cap", () => {
    expect(staggerFor(500) * (STAGGER.maxItems - 1)).toBeLessThanOrEqual(STAGGER.productMaxTotal + 1e-9);
  });
  it("lands data on skeletons almost together (≤20 ms each, ≤80 ms in all)", () => {
    expect(swapStaggerFor(1)).toBe(0);
    expect(swapStaggerFor(3)).toBeLessThanOrEqual(0.02);
    expect(swapStaggerFor(500) * (STAGGER.maxItems - 1)).toBeLessThanOrEqual(0.08 + 1e-9);
  });
});
