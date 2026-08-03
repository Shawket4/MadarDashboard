import { describe, expect, it, vi } from "vitest";

import {
  InsecureRandomError,
  PASSPHRASE_ALPHABET,
  generatePassphrase,
  hasSecureRandom,
  type RandomBytes,
} from "./passphrase";

/** Feeds a scripted byte sequence, cycling if the generator asks for more. */
const scriptedBytes = (script: number[]): RandomBytes => {
  let i = 0;
  return (out) => {
    for (let n = 0; n < out.length; n += 1) {
      out[n] = script[i % script.length];
      i += 1;
    }
  };
};

describe("generatePassphrase", () => {
  it("produces five dash-separated groups of four", () => {
    for (let n = 0; n < 50; n += 1) {
      expect(generatePassphrase()).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/);
    }
  });

  it("never emits a glyph that is ambiguous when read aloud", () => {
    const symbols = Array.from({ length: 500 }, () => generatePassphrase())
      .join("")
      .replace(/-/g, "");

    for (const ch of symbols) {
      expect(PASSPHRASE_ALPHABET).toContain(ch);
    }
    // The specific confusable pairs the alphabet exists to avoid.
    expect(symbols).not.toMatch(/[01OIL]/);
    // Nothing lowercase — "is that a lowercase el?" is exactly the failure mode.
    expect(symbols).toBe(symbols.toUpperCase());
  });

  it("can emit every symbol in the alphabet", () => {
    const seen = new Set(
      Array.from({ length: 500 }, () => generatePassphrase()).join("").replace(/-/g, ""),
    );
    // Guards an off-by-one that silently drops the last symbol.
    expect(seen.size).toBe(PASSPHRASE_ALPHABET.length);
  });

  it("rejects out-of-range bytes instead of folding them (no modulo bias)", () => {
    // 248..255 are the bytes that would bias toward the first 8 symbols if they
    // were reduced with `%` rather than discarded. Lead with all of them: if
    // they were folded, the output would start with 2,3,4,5,6,7,8,9.
    const script = [248, 249, 250, 251, 252, 253, 254, 255, ...Array.from({ length: 20 }, (_, i) => i)];

    const out = generatePassphrase(scriptedBytes(script)).replace(/-/g, "");

    // Every byte 248..255 discarded, so the symbols come from bytes 0..19.
    const expected = Array.from({ length: 20 }, (_, i) => PASSPHRASE_ALPHABET[i]).join("");
    expect(out).toBe(expected);
  });

  it("distributes symbols evenly using the real CSPRNG", () => {
    // Statistical rather than scripted: the generator refills a 32-byte buffer
    // and discards whatever it doesn't need, so a scripted byte cycle probes
    // that buffering artifact rather than the distribution. 40k symbols over 31
    // buckets has σ ≈ 35, so a ±20% band is a ~7σ guard — tight enough to catch
    // real bias, loose enough never to flake.
    const SAMPLES = 2000;
    const counts = new Map<string, number>();
    for (let n = 0; n < SAMPLES; n += 1) {
      for (const ch of generatePassphrase().replace(/-/g, "")) {
        counts.set(ch, (counts.get(ch) ?? 0) + 1);
      }
    }

    expect(counts.size).toBe(PASSPHRASE_ALPHABET.length);
    const mean = (SAMPLES * 20) / PASSPHRASE_ALPHABET.length;
    for (const [symbol, count] of counts) {
      expect(Math.abs(count - mean) / mean, `symbol ${symbol}`).toBeLessThan(0.2);
    }
  });

  it("does not repeat itself", () => {
    const draws = new Set(Array.from({ length: 1000 }, () => generatePassphrase()));
    expect(draws.size).toBe(1000);
  });

  it("throws rather than falling back to insecure randomness", () => {
    vi.stubGlobal("crypto", {});
    try {
      expect(hasSecureRandom()).toBe(false);
      expect(() => generatePassphrase()).toThrow(InsecureRandomError);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
