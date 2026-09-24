// @vitest-environment node
//
// `phone_vectors.json` is madar-shared's file (crates/madar-ids/vectors), the
// one the backend's SQL and Rust rule and the POS core are tested against.
// This app keeps a copy for its TypeScript rule; these checks keep it the
// SAME bytes: against the hash recorded beside it, and — when a madar-shared
// checkout sits beside this one (or MADAR_SHARED_DIR names one) — against the
// file itself. CI also fetches it at the recorded tag
// (scripts/check-shared-vectors.sh).
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import source from "./phone_vectors.source.json";

const copy = resolve(__dirname, "phone_vectors.json");

describe("phone_vectors.json is madar-shared's", () => {
  it("has the bytes recorded for its tag", () => {
    const sha = createHash("sha256").update(readFileSync(copy)).digest("hex");
    expect(sha).toBe(source.sha256);
  });

  const shared = resolve(
    process.env.MADAR_SHARED_DIR ?? resolve(__dirname, "../../../madar-shared"),
    source.path,
  );
  it.skipIf(!existsSync(shared))("is byte-identical to the madar-shared checkout beside it", () => {
    expect(readFileSync(copy).equals(readFileSync(shared))).toBe(true);
  });
});
