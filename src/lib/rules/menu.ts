/**
 * The menu import's rules: madar-shared's `menu` package (the Foodics reader,
 * the bulk menu's checks, the replace sentence). It is not in the boot
 * package: the import dialog loads it when it opens, so a dashboard that never
 * imports a menu never downloads the reader. Vitest loads it from disk
 * (src/test/setup.ts).
 */
import type * as Menu from "./wasm/menu/madar_menu.js";

export type * from "./wasm/menu/madar_menu.js";
export type MenuRules = typeof Menu;

let loading: Promise<MenuRules> | undefined;

/** The package, instantiated once; a failed load (offline) is tried again next time. */
export function menuRules(): Promise<MenuRules> {
  loading ??= import("./wasm/menu/madar_menu.js").then(
    async (pkg) => {
      await pkg.default();
      return pkg;
    },
    (e: unknown) => {
      loading = undefined;
      throw e;
    },
  );
  return loading;
}

/** For tests: the package from bytes on disk. */
export async function initMenuRules(
  pkg: MenuRules,
  wasm: BufferSource,
): Promise<void> {
  await pkg.default({ module_or_path: wasm });
  loading = Promise.resolve(pkg);
}
