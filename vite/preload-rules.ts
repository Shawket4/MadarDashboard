import type { HtmlTagDescriptor, Plugin } from "vite";

/**
 * Start the rules' WebAssembly download with the HTML. Each bundle's main.tsx
 * awaits `initRules` before its first render (the date scope, money and
 * business-day helpers call the rules while rendering), and wasm-bindgen only
 * fetches the file once the whole entry graph has been evaluated. This adds a
 * `<link rel="preload" as="fetch" type="application/wasm" crossorigin>` for the
 * hashed `madar_web_bg-*.wasm`, so it downloads in parallel with the JS and is
 * in the cache when `initRules` asks for it (`crossorigin` makes the preload
 * match wasm-bindgen's `fetch(url)`, which is a CORS-mode request).
 * Same-origin, so the CSP's `connect-src 'self'` covers it.
 */
export const RULES_WASM = /(^|\/)madar_web_bg-[\w-]+\.wasm$/;

export function rulesPreloadTags(fileNames: Iterable<string>, base: string): HtmlTagDescriptor[] {
  const tags: HtmlTagDescriptor[] = [];
  for (const fileName of fileNames) {
    if (!RULES_WASM.test(fileName)) continue;
    tags.push({
      tag: "link",
      attrs: { rel: "preload", as: "fetch", type: "application/wasm", crossorigin: true, href: `${base}${fileName}` },
      injectTo: "head-prepend",
    });
  }
  return tags;
}

export function preloadRules(): Plugin {
  let base = "/";
  return {
    name: "preload-rules",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        if (!ctx.bundle) return;
        return rulesPreloadTags(
          Object.values(ctx.bundle)
            .filter((f) => f.type === "asset")
            .map((f) => f.fileName),
          base,
        );
      },
    },
  };
}
