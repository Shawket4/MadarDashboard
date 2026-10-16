// Madar marketing site: get.madar-pos.cloud
// Static output: every page is prerendered HTML, in English (/en/…) and Arabic (/ar/…).
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { copyFile, access, readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { promisify } from "node:util";
import { brotliCompress, gzip, constants as zlib } from "node:zlib";
import { execSync } from "node:child_process";
import { pack } from "./integrations/pack.mjs";
import { agentFiles } from "./scripts/agent-files.mjs";
import { PAGES, PAGE_URLS, LANGS } from "./src/lib/pages.ts";

export const SITE = "https://get.madar-pos.cloud";

/**
 * The get vhost serves the root page for / as `get.html` (`location = /`, see
 * deploy/nginx/get.madar-pos.cloud), so ship it under that name too, and publish the
 * sitemap as sitemap.xml (robots.txt points there) beside the integration's files.
 */
function rootAlias() {
  return {
    name: "madar-root-alias",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir);
        await copyFile(`${out}index.html`, `${out}get.html`);
        const urls = `${out}sitemap-0.xml`;
        if (await access(urls).then(() => true, () => false)) await copyFile(urls, `${out}sitemap.xml`);
      },
    },
  };
}

/**
 * The page registry (src/lib/pages.ts) against the source: every registered page has its
 * file and its copy in each of its languages, and every page file is registered. Fails the
 * build, saying what is missing and where, before anything is built.
 */
function pagesRegistry() {
  return {
    name: "madar-pages-registry",
    hooks: {
      "astro:config:setup": async () => {
        const src = fileURLToPath(new URL("./src/", import.meta.url));
        const exists = (p) => access(path.join(src, p)).then(() => true, () => false);
        const { en } = await import("./src/i18n/en.ts");
        const { ar } = await import("./src/i18n/ar.ts");
        const copy = { en, ar };
        const problems = [];
        const files = new Set();
        for (const page of PAGES) {
          const file = page.langLast
            ? `pages/${page.path}[lang].astro`
            : `pages/[lang]/${page.path ? page.path.replace(/\/$/, "") : "index"}.astro`;
          files.add(file);
          if (!(await exists(file))) problems.push(`page "${page.key}" is registered but src/${file} is missing`);
          const module = (await exists(`i18n/pages/${page.key}.ts`)) ? await import(`./src/i18n/pages/${page.key}.ts`) : null;
          for (const lang of page.langs ?? LANGS) {
            if (!copy[lang].meta[page.key] && !module?.[lang]) {
              problems.push(`page "${page.key}" has no ${lang === "ar" ? "Arabic" : "English"} copy (meta.${page.key} in src/i18n/${lang}.ts, or \`export const ${lang}\` in src/i18n/pages/${page.key}.ts)`);
            }
          }
        }
        for (const dir of ["pages/[lang]"]) {
          for (const entry of await readdir(path.join(src, dir))) {
            if (entry.endsWith(".astro") && !entry.startsWith("_") && !files.has(`${dir}/${entry}`)) {
              problems.push(`src/${dir}/${entry} is not in the page registry (src/lib/pages.ts): add it there, or run npm run new:page`);
            }
          }
        }
        if (problems.length) throw new Error(`The page registry and the source disagree:\n  ${problems.join("\n  ")}`);
      },
    },
  };
}

/**
 * A <link rel="modulepreload"> in each page's <head> for every chunk its module scripts
 * import (Astro adds none), so the browser fetches them beside the script instead of a
 * round trip after it: the header's menu and the hero's figures wait on that graph
 * (about 400 ms later on a mid phone without it). Runs before the root alias and the
 * archive, so get.html and the archive's pages have them too.
 */
function modulePreload() {
  return {
    name: "madar-modulepreload",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const out = fileURLToPath(dir);
        const graph = new Map();
        // A chunk's static imports, all the way down (dynamic import() is left to load late).
        const deps = async (file) => {
          if (graph.has(file)) return graph.get(file);
          graph.set(file, new Set());
          const code = await readFile(path.join(out, file), "utf8");
          const found = new Set();
          for (const [, rel] of code.matchAll(/\bimport\s*(?:[\w$*{},\s]+?\s*from\s*)?["'](\.\/[^"']+?\.js)["']/g)) {
            const dep = path.posix.join(path.posix.dirname(file), rel);
            found.add(dep);
            for (const d of await deps(dep)) found.add(d);
          }
          graph.set(file, found);
          return found;
        };
        async function* pages(d) {
          for (const entry of await readdir(d, { withFileTypes: true })) {
            const p = path.join(d, entry.name);
            if (entry.isDirectory()) yield* pages(p);
            else if (entry.name.endsWith(".html")) yield p;
          }
        }
        for await (const page of pages(out)) {
          const html = await readFile(page, "utf8");
          const want = new Set();
          for (const [, src] of html.matchAll(/<script type="module" src="\/([^"]+\.js)"/g)) for (const d of await deps(src)) want.add(d);
          if (!want.size) continue;
          const links = [...want].map((d) => `<link rel="modulepreload" href="/${d}">`).join("");
          await writeFile(page, html.replace("</head>", `${links}</head>`));
        }
      },
    },
  };
}

/**
 * The sitemap's <lastmod>: the date of the last commit that touched the site's source,
 * so it moves when the pages do and not on every rebuild. Falls back to the build date
 * where git history isn't there (a shallow CI clone whose head didn't touch site/).
 */
function lastModified() {
  try {
    const out = execSync("git log -1 --format=%cI -- src public", { cwd: fileURLToPath(new URL(".", import.meta.url)), stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (out) return new Date(out);
  } catch {}
  return new Date();
}

/**
 * Precompressed copies beside every text file (`.br` and `.gz`), as the old landing's
 * build made them: nginx can send them straight away (`brotli_static` / `gzip_static`)
 * instead of compressing on each request. The originals stay for clients that
 * want neither. Runs after the root alias, so get.html and sitemap.xml get theirs.
 */
function precompress() {
  const TEXT = /\.(html|css|js|mjs|json|svg|xml|txt|md|webmanifest|wasm)$/;
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
    pagesRegistry(),
    sitemap({
      // Only the registry's pages (src/lib/pages.ts): the root and /free/ are bilingual
      // signposts to them, 404 isn't a page.
      filter: (page) => PAGE_URLS.some((u) => new URL(u.href, SITE).href === page),
      lastmod: lastModified(),
      // Each page's alternates from the registry: its languages, and x-default (English),
      // as each page's own hreflang says.
      serialize: (item) => {
        const key = PAGE_URLS.find((u) => new URL(u.href, SITE).href === item.url)?.key;
        const alternates = PAGE_URLS.filter((u) => u.key === key);
        const en = alternates.find((u) => u.lang === "en");
        return {
          ...item,
          links: [
            ...alternates.map((u) => ({ url: new URL(u.href, SITE).href, lang: u.lang })),
            ...(en ? [{ url: new URL(en.href, SITE).href, lang: "x-default" }] : []),
          ],
        };
      },
    }),
    modulePreload(),
    rootAlias(),
    // Markdown versions, /index.md and llms.txt, read back from the built pages.
    agentFiles(SITE),
    // The whole site as one archive and the service worker that serves it (before the
    // precompression, so sw.js gets its .br and .gz too).
    pack(),
    precompress(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // Never inline a script: Astro inlines a page's script under 4 KB, and the CSP
      // (script-src 'self') blocks inline scripts, so it would silently never run (the
      // Free page's crew.ts, 2026-10-14). Everything else keeps Vite's default.
      assetsInlineLimit: (file) => (/\.[cm]?js$/.test(file) ? false : undefined),
    },
    resolve: {
      // Code shared with the dashboard (../shared): the family showcase's 3D engine.
      alias: { "@shared": fileURLToPath(new URL("../shared", import.meta.url)) },
      // The shared engine sits outside this package; its "three" is this package's.
      dedupe: ["three"],
    },
    server: {
      fs: { allow: [fileURLToPath(new URL(".", import.meta.url)), fileURLToPath(new URL("../shared", import.meta.url))] },
    },
  },
});
