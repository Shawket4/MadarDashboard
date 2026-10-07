// Madar marketing site: get.madar-pos.cloud
// Static output: every page is prerendered HTML, in English (/en/…) and Arabic (/ar/…).
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { copyFile, access, readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants as zlib } from "node:zlib";

export const SITE = "https://get.madar-pos.cloud";

/**
 * The previous landing was a single-page app whose entry file was `get.html`, and
 * nginx still falls back to that file for every path that isn't a file. The VPS
 * keeps old files on deploy, so ship the root page under that name too (it routes
 * those paths; see src/pages/index.astro), marked so it knows it came as the
 * fallback, and overwrite the old single-URL sitemap.xml with the real one.
 */
function rootAlias() {
  return {
    name: "madar-root-alias",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir);
        const root = await readFile(`${out}index.html`, "utf8");
        if (!root.includes("<html lang=\"en\" dir=\"ltr\">")) throw new Error("root page: <html> tag changed, update the get.html marker");
        await writeFile(`${out}get.html`, root.replace("<html lang=\"en\" dir=\"ltr\">", "<html lang=\"en\" dir=\"ltr\" data-fallback>"));
        const urls = `${out}sitemap-0.xml`;
        if (await access(urls).then(() => true, () => false)) await copyFile(urls, `${out}sitemap.xml`);
      },
    },
  };
}

/**
 * Precompressed copies beside every text file (`.br` and `.gz`), as the old landing's
 * build made them: nginx can send them straight away (`brotli_static` / `gzip_static`)
 * instead of compressing on each request. The originals stay for clients that
 * want neither. Runs after the root alias, so get.html and sitemap.xml get theirs.
 */
function precompress() {
  const TEXT = /\.(html|css|js|mjs|json|svg|xml|txt|webmanifest|wasm)$/;
  const MIN = 1024; // smaller files aren't worth a second request path
  const br = promisify(brotliCompress);
  const gz = promisify(gzip);
  async function* walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) yield* walk(p);
      else if (TEXT.test(entry.name)) yield p;
    }
  }
  return {
    name: "madar-precompress",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        let files = 0, before = 0, after = 0;
        for await (const file of walk(fileURLToPath(dir))) {
          const body = await readFile(file);
          if (body.length < MIN) continue;
          const mode = file.endsWith(".wasm") ? zlib.BROTLI_MODE_GENERIC : zlib.BROTLI_MODE_TEXT;
          const [b, g] = await Promise.all([
            br(body, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11, [zlib.BROTLI_PARAM_MODE]: mode, [zlib.BROTLI_PARAM_SIZE_HINT]: body.length } }),
            gz(body, { level: 9 }),
          ]);
          // Only keep a copy that actually saves something.
          if (b.length < body.length * 0.95) await writeFile(`${file}.br`, b);
          if (g.length < body.length * 0.95) await writeFile(`${file}.gz`, g);
          files++; before += body.length; after += Math.min(b.length, body.length);
        }
        logger.info(`${files} files precompressed: ${(before / 1e6).toFixed(2)} MB → ${(after / 1e6).toFixed(2)} MB with brotli`);
      },
    },
  };
}

export default defineConfig({
  site: SITE,
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
    // nginx on the VPS serves /assets/ with a one-year immutable cache (the old
    // landing's folder) and everything else with no-store. Hashed files go there.
    assets: "assets",
  },
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [
    react(),
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en", ar: "ar" } },
      // Only the language pages: the root is a language picker, 404 isn't a page.
      filter: (page) => /\/(en|ar)\//.test(page),
    }),
    rootAlias(),
    precompress(),
  ],
  vite: { plugins: [tailwindcss()] },
});
