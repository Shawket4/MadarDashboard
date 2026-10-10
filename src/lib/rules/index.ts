/**
 * madar-shared's rules, the same Rust the backend and the POS run, compiled to
 * WebAssembly (SHARED_RULES_PLAN.md Step 3). The web computes no rule itself:
 * a rule module here wraps a `rules.*` call and keeps its TS signature, and its
 * vector test runs against the wasm.
 *
 * Two packages, vendored by `npm run sync:rules` (never edit wasm/):
 * - `wasm/full`: the dashboard, awaited in src/main.tsx;
 * - `wasm/public`: a subset for the customer bundles (order, reservations,
 *   loyalty), awaited in their main.tsx.
 * Each entry imports its package and awaits `initRules` before its first render;
 * vitest loads the full one from disk (src/test/setup.ts). After that every
 * call is synchronous.
 */
import type * as Full from "./wasm/full/madar_web.js";
import type * as Public from "./wasm/public/madar_web.js";

export type * from "./wasm/full/madar_web.js";

/**
 * Every rule, typed from the full package's .d.ts.
 * ponytail: a customer bundle holds the public package, so a full-only rule
 * (madar-time, units, inventory, till, dawam, …) is undefined there and throws
 * when called; ask for it in madar-web's `public` feature if a public page needs it.
 */
export let rules: typeof Full;

/** Instantiate the package once (bytes from disk in Node; fetched by URL in a browser). */
export async function initRules(pkg: typeof Full | typeof Public, wasm?: BufferSource): Promise<void> {
  await pkg.default(wasm && { module_or_path: wasm });
  rules = pkg as typeof Full;
}
