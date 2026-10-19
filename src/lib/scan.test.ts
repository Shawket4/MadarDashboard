import { describe, expect, it } from "vitest";

import vectors from "./scan_vectors.json";
import { classifyScan } from "./scan";

describe("classifyScan (madar-shared's Rust, via wasm) — the shared vectors", () => {
  it.each(vectors as [string, string, string][])("%j → %s %s", (raw, kind, value) => {
    expect(classifyScan(raw)).toEqual({ kind, value });
  });
});
