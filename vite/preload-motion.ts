import type { HtmlTagDescriptor, Plugin } from "vite";

/**
 * Start GSAP's download with the HTML. GSAP stays out of the eager graph (it
 * is only imported dynamically, src/lib/motion/gsap.ts), but motion must not
 * wait for an idle callback: this adds a `<link rel="modulepreload">` for every
 * chunk holding GSAP's core (not Flip, which only reordering lists need), so it
 * downloads in parallel with the app and is ready for the first entrance.
 * Preloading fetches and parses; nothing runs until the app imports it.
 */
export const GSAP_MODULE = /[\\/]node_modules[\\/]gsap[\\/]/;

export function preloadMotion(): Plugin {
  let base = "/";
  return {
    name: "preload-motion",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: "post",
      handler(_html, ctx) {
        if (!ctx.bundle) return;
        const tags: HtmlTagDescriptor[] = [];
        for (const chunk of Object.values(ctx.bundle)) {
          if (chunk.type !== "chunk" || chunk.isEntry) continue;
          const ids = Object.keys(chunk.modules);
          if (!ids.some((id) => GSAP_MODULE.test(id)) || ids.some((id) => /Flip/.test(id))) continue;
          tags.push({
            tag: "link",
            attrs: { rel: "modulepreload", crossorigin: true, href: `${base}${chunk.fileName}` },
            injectTo: "head",
          });
        }
        return tags;
      },
    },
  };
}
