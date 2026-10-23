/**
 * The Rewards card designer's rules: madar-shared's `card` package (madar-card:
 * templates, validation, layout, the strip's SVG, stamp tracks, audiences and
 * message limits). Not in the boot package: the Rewards pages that need it load
 * it when they open. Vitest loads it from disk (src/test/setup.ts).
 */
import type * as Card from "./wasm/card/madar_card.js";

export type * from "./wasm/card/madar_card.js";
export type CardRules = typeof Card;

let loading: Promise<CardRules> | undefined;
let ready: CardRules | undefined;

/** The package, instantiated once; a failed load (offline) is tried again next time. */
export function cardRules(): Promise<CardRules> {
  loading ??= import("./wasm/card/madar_card.js").then(
    async (pkg) => {
      await pkg.default();
      ready = pkg;
      return pkg;
    },
    (e: unknown) => {
      loading = undefined;
      throw e;
    },
  );
  return loading;
}

/** The package if it has already loaded (synchronous callers after `cardRules()`). */
export function cardRulesNow(): CardRules | undefined {
  return ready;
}

/** For tests: the package from bytes on disk. */
export async function initCardRules(pkg: CardRules, wasm: BufferSource): Promise<void> {
  await pkg.default({ module_or_path: wasm });
  ready = pkg;
  loading = Promise.resolve(pkg);
}
