import type { Plugin } from "vite";

/**
 * zod without its JIT, set where it cannot come too late.
 *
 * Every page's Content-Security-Policy forbids eval (deploy/nginx/madar-csp-*.conf),
 * and zod probes for it with `Function("")`, then compiles its fast paths with
 * `new Function`. Refused, it falls back fine, but the browser reports each try as
 * a violation. Calling `z.config({ jitless: true })` from an entry is too late
 * wherever a chunk the entry imports parses at load: ES modules run their imports
 * first. zod reads its config from `globalThis.__zod_globalConfig` when its core
 * module loads, so this sets it at the top of that very module, before any zod
 * code in any chunk runs.
 */
export const ZOD_CORE = /[\\/]zod[\\/]v4[\\/]core[\\/]core\.js$/;

export function zodJitless(): Plugin {
  return {
    name: "zod-jitless",
    transform(code, id) {
      if (!ZOD_CORE.test(id.split("?")[0])) return null;
      return { code: `(globalThis.__zod_globalConfig ??= {}).jitless = true;\n${code}`, map: null };
    },
  };
}
