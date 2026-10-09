// @vitest-environment node
//
// Every `<name>.json` here with a `<name>.source.json` beside it is a copy of a
// madar-shared vectors file: the cases the backend's Rust (and the POS core)
// are tested against, kept so this app's TypeScript copy of the rule is tested
// against the same ones. These checks keep each copy the SAME bytes: against
// the hash recorded beside it, and — when a madar-shared checkout sits beside
// this one (or MADAR_SHARED_DIR names one) — against the file itself. CI also
// fetches each at its recorded tag (scripts/check-shared-vectors.sh).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const sources = readdirSync(__dirname).filter((f) => f.endsWith(".source.json"));
const checkout = process.env.MADAR_SHARED_DIR ?? resolve(__dirname, "../../../madar-shared");

it("pins at least the phone and inventory vectors", () => {
  expect(sources).toEqual(expect.arrayContaining(["phone_vectors.source.json", "inventory_vectors.source.json"]));
});

describe.each(sources)("%s", (file) => {
  const source = JSON.parse(readFileSync(resolve(__dirname, file), "utf8")) as { path: string; sha256: string };
  const copy = resolve(__dirname, file.replace(/\.source\.json$/, ".json"));

  it("has the bytes recorded for its tag", () => {
    const sha = createHash("sha256").update(readFileSync(copy)).digest("hex");
    expect(sha).toBe(source.sha256);
  });

  const shared = resolve(checkout, source.path);
  it.skipIf(!existsSync(shared))("is byte-identical to the madar-shared checkout beside it", () => {
    expect(readFileSync(copy).equals(readFileSync(shared))).toBe(true);
  });
});
