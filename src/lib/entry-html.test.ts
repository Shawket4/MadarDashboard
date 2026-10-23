/**
 * Zoom is blocked on every page this repo builds (owner decision 2026-10-23;
 * CLAUDE.md "Zoom"): pinch-zoom by the viewport meta of each Vite entry,
 * double-tap zoom by `touch-action: manipulation`, and iOS's zoom on focusing
 * a small field by keeping every field at 16px on phones. Each is one line that
 * a later edit could drop without anyone noticing on a desktop.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
/** Every Vite entry: the HTML files at the repo's root (the Astro site in `site/` is its own). */
const entries = readdirSync(root).filter((f) => f.endsWith(".html"));
const css = readFileSync(join(root, "src/styles/globals.css"), "utf8");

describe("zoom is blocked on every entry", () => {
  it("finds the five entries", () => {
    expect(entries.sort()).toEqual(["index.html", "loyalty.html", "order.html", "reservations.html", "rewards.html"]);
  });

  for (const entry of entries) {
    it(`${entry} blocks pinch-zoom in its viewport meta`, () => {
      const html = readFileSync(join(root, entry), "utf8");
      const meta = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"/);
      expect(meta, entry).not.toBeNull();
      const parts = meta![1].split(",").map((p) => p.trim().replace(/\s+/g, ""));
      for (const p of ["width=device-width", "initial-scale=1.0", "maximum-scale=1.0", "user-scalable=no", "viewport-fit=cover"]) {
        expect(parts, `${entry}: ${p}`).toContain(p);
      }
    });
  }

  it("turns double-tap zoom off on the roots", () => {
    expect(css).toMatch(/html,\s*body\s*\{\s*touch-action:\s*manipulation;/);
  });

  it("keeps every field at 16px on phones, so iOS never zooms in on focus", () => {
    expect(css).toMatch(
      /@media screen and \(max-width: 768px\) \{\s*input,\s*select,\s*textarea,\s*\[cmdk-input\] \{\s*font-size: 16px !important;/,
    );
  });
});
