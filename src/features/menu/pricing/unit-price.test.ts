/**
 * madar-shared's catalog_vectors.json (src/lib, pinned to its tag): the lines
 * `madar_catalog::price` is tested against. Each case's unit price is this
 * rule over its item view; the options half of a line is not the dashboard's.
 */
import { describe, expect, it } from "vitest";

import vectors from "@/lib/catalog_vectors.json";

import { unitPrice, type PricedSize } from "./unit-price";

interface VCase {
  name: string;
  item: string;
  selection: { size_label: string | null };
  expected: { line?: { unit_price: number }; error?: { error: string } };
}
const views = new Map(
  (vectors.items as unknown as { key: string; view: { branch_price: number | null; sizes: PricedSize[] } }[]).map((i) => [i.key, i.view]),
);
const cases = vectors.cases as unknown as VCase[];
// Skipped: unknown_option — an option error; the size price is not in its answer.
const priced = cases.filter((c) => c.expected.error?.error !== "unknown_option");

describe("unit price matches madar-shared's catalog vectors", () => {
  it("covers the cases", () => expect(priced.length).toBeGreaterThanOrEqual(45));

  it.each(priced)("$name", (c) => {
    const view = views.get(c.item)!;
    const want = c.expected.line ? c.expected.line.unit_price : null; // no_priced_size → null
    expect(unitPrice(view.sizes, c.selection.size_label, view.branch_price)).toBe(want);
  });
});
