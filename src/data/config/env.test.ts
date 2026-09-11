import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { __envSchema } from "./env";

const parse = (v: string) => __envSchema.safeParse({ VITE_API_URL: v });

describe("VITE_API_URL", () => {
  it("takes an absolute origin", () => {
    expect(parse("https://api.madar-pos.cloud").success).toBe(true);
    expect(parse("http://localhost:8081").success).toBe(true);
  });

  // The two `:shop` bundles are ONE artifact served from every branded shop's
  // hostname, so there is no single origin to bake in — they ask their own.
  it("takes a root-relative path, which the shop bundles need", () => {
    expect(parse("/api").success).toBe(true);
  });

  it("refuses what is neither", () => {
    expect(parse("api.madar-pos.cloud").success).toBe(false);
    expect(parse("").success).toBe(false);
    // Protocol-relative reads as a path and behaves as another origin.
    expect(parse("//somewhere.else/api").success).toBe(false);
  });
});

/**
 * THE GUARD, and the reason this file exists.
 *
 * `z.string().url()` rejected `/api`, and the deploy had always passed `/api`
 * for the two shop builds. So those bundles shipped with an env var that failed
 * validation at boot — they threw before rendering anything, while nginx served
 * them with a perfectly good `200 text/html`. Every check that looked at the
 * response passed. The page was blank.
 *
 * A unit test of the schema alone would not have caught it, because the schema
 * was self-consistent. What was wrong was the gap between the schema and what
 * the pipeline actually passes, so that gap is what this closes.
 */
describe("the values the deploy workflow passes", () => {
  it("are all accepted by the schema", () => {
    const yml = readFileSync(".github/workflows/deploy.yml", "utf8");
    const values = [...yml.matchAll(/^\s*VITE_API_URL:\s*(\S+)\s*$/gm)].map((m) => m[1]);

    expect(values.length).toBeGreaterThan(5);
    for (const v of values) {
      expect(parse(v).success, `deploy.yml passes VITE_API_URL: ${v}`).toBe(true);
    }
  });
});
