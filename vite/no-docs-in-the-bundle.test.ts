import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ResolvedConfig } from "vite";

import { isDoc, noDocsInTheBundle } from "./no-docs-in-the-bundle";

describe("isDoc", () => {
  it("matches documentation and what the compressor made of it", () => {
    for (const n of ["README.md", "readme.MD", "notes.markdown", "README.md.br", "README.md.gz"]) {
      expect(isDoc(n), n).toBe(true);
    }
  });

  it("leaves real assets alone", () => {
    for (const n of ["order-menu-en.webp", "index.html", "app.js", "app.js.br", "madar.svg"]) {
      expect(isDoc(n), n).toBe(false);
    }
  });
});

/**
 * The behaviour, not just the pattern: `public/` is copied verbatim and the
 * READMEs live in SUBDIRECTORIES of it (`screenshots/`, `wallet/`), so a sweep
 * that only looked at the top level would have found nothing and reported
 * success.
 */
describe("the sweep", () => {
  it("removes docs at every depth and keeps everything else", async () => {
    const out = await mkdtemp(path.join(tmpdir(), "no-docs-"));
    await mkdir(path.join(out, "screenshots"), { recursive: true });
    await mkdir(path.join(out, "wallet", "deeper"), { recursive: true });
    await writeFile(path.join(out, "index.html"), "<!doctype html>");
    await writeFile(path.join(out, "screenshots", "README.md"), "what these are");
    await writeFile(path.join(out, "screenshots", "shot.webp"), "binary-ish");
    await writeFile(path.join(out, "wallet", "README.md"), "doc");
    await writeFile(path.join(out, "wallet", "README.md.br"), "compressed doc");
    await writeFile(path.join(out, "wallet", "deeper", "notes.markdown"), "doc");
    await writeFile(path.join(out, "wallet", "deeper", "pass.png"), "binary-ish");

    const plugin = noDocsInTheBundle();
    // The plugin reads the resolved config for the output directory.
    const configResolved = plugin.configResolved as (c: ResolvedConfig) => void;
    configResolved({ root: out, build: { outDir: "." } } as unknown as ResolvedConfig);
    await (plugin.closeBundle as () => Promise<void>)();

    const at = async (d: string) => (await readdir(path.join(out, d))).sort();
    expect(await at(".")).toEqual(["index.html", "screenshots", "wallet"]);
    expect(await at("screenshots")).toEqual(["shot.webp"]);
    expect(await at("wallet")).toEqual(["deeper"]);
    expect(await at("wallet/deeper")).toEqual(["pass.png"]);
  });

  it("does not fail a build when there is no output directory", async () => {
    const plugin = noDocsInTheBundle();
    const configResolved = plugin.configResolved as (c: ResolvedConfig) => void;
    configResolved({
      root: path.join(tmpdir(), "definitely-not-here"),
      build: { outDir: "nope" },
    } as unknown as ResolvedConfig);
    await expect((plugin.closeBundle as () => Promise<void>)()).resolves.toBeUndefined();
  });
});
