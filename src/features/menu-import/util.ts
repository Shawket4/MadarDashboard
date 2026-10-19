import type { TFunction } from "i18next";

import type {
  BulkMenu,
  BulkRefusal,
  BulkSummary,
  FoodicsError,
  FoodicsFile,
  FoodicsParsed,
  FoodicsWarning,
  MenuRules,
} from "@/lib/rules/menu";

/**
 * The self-serve menu import (Madar MENU_IMPORT_PLAN.md). The files are read
 * here, in the browser, by madar-shared's Foodics reader (its own wasm
 * package, `menuRules()`, loaded when the dialog opens); only the menu it
 * builds goes to the server, which runs the same checks.
 */

/** The most one file may weigh, as the reader allows (madar-menu MAX_FILE_BYTES). */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type ReadResult =
  | { ok: true; parsed: FoodicsParsed; names: Map<FoodicsFile, string> }
  | { ok: false; message: string };

/** The Foodics exports, in the order the owner downloads them. */
export const FOODICS_FILES: FoodicsFile[] = [
  "categories",
  "products",
  "modifier_groups",
  "modifier_options",
  "product_modifiers",
];

const isError = (r: FoodicsParsed | FoodicsError): r is FoodicsError =>
  "error" in r;
export const isRefusal = (r: BulkSummary | BulkRefusal): r is BulkRefusal =>
  "refusal" in r;

/** Reads the picked files and runs the Foodics reader over their text. */
export async function readFoodicsFiles(
  files: File[],
  menu: MenuRules,
  t: TFunction,
): Promise<ReadResult> {
  const big = files.find((f) => f.size > MAX_FILE_BYTES);
  if (big)
    return {
      ok: false,
      message: t("menuImport.errors.tooBig", {
        name: big.name,
        defaultValue: `${big.name} is too large to be a menu export.`,
      }),
    };
  const texts = await Promise.all(files.map((f) => f.text()));
  const result = menu.foodics_parse(texts);
  if (isError(result))
    return { ok: false, message: foodicsErrorMessage(result, files, t) };
  // The reader names each file's kind in the order they were given.
  const names = new Map(
    result.files.map((kind, i) => [kind, files[i].name] as const),
  );
  return { ok: true, parsed: result, names };
}

export function fileLabel(kind: FoodicsFile, t: TFunction): string {
  return t(`menuImport.files.${kind}`, kind);
}

function foodicsErrorMessage(
  e: FoodicsError,
  files: File[],
  t: TFunction,
): string {
  switch (e.error) {
    case "unknown_file":
      return t("menuImport.errors.unknownFile", {
        name: files[e.index]?.name ?? "",
        defaultValue: `${files[e.index]?.name ?? ""} is not a Foodics menu export.`,
      });
    case "duplicate_file":
      return t("menuImport.errors.duplicateFile", {
        file: fileLabel(e.kind, t),
        defaultValue: "Two of the files are the same export.",
      });
    case "missing_products":
      return t(
        "menuImport.errors.missingProducts",
        "Add the products export: it holds the items themselves.",
      );
    case "too_big":
      return t("menuImport.errors.tooBig", {
        name: files[e.index]?.name ?? "",
        defaultValue: "A file is too large to be a menu export.",
      });
    case "bad_csv":
      return t("menuImport.errors.badCsv", {
        file: fileLabel(e.kind, t),
        line: e.line,
        defaultValue: "A file could not be read.",
      });
  }
}

/** One warning the reader gave, as a sentence. */
export function warningMessage(w: FoodicsWarning, t: TFunction): string {
  const i = w.issue;
  const v = { ...i, defaultValue: i.issue } as Record<string, unknown>;
  if (i.issue === "missing_file") v.file = fileLabel(i.kind, t);
  if (i.issue === "not_a_number" || i.issue === "not_yes_no")
    v.value = i.value || "—";
  return t(`menuImport.issues.${i.issue}`, v);
}

/** Where a warning points: the file and the line, when it has them. */
export function warningPlace(w: FoodicsWarning, t: TFunction): string | null {
  if (!w.file) return null;
  return w.line
    ? t("menuImport.place", {
        file: fileLabel(w.file, t),
        line: w.line,
        defaultValue: `${w.file}, line ${w.line}`,
      })
    : fileLabel(w.file, t);
}

/** Why the server (or the same checks here) would refuse a menu. */
export function refusalMessage(r: BulkRefusal, t: TFunction): string {
  const v = { ...r, defaultValue: r.refusal } as Record<string, unknown>;
  if ("what" in r) v.what = t(`menuImport.things.${r.what}`, r.what);
  return t(`menuImport.refusals.${r.refusal}`, v);
}

/** Add into an empty menu; replace one that has anything in it. */
export type ImportMode = "add" | "replace";

export const modeFor = (live: {
  categories: number;
  items: number;
}): ImportMode => (live.categories + live.items > 0 ? "replace" : "add");

/** Every item under its category, in the file's order, for the preview. */
export function byCategory(
  menu: BulkMenu,
): { name: string; items: NonNullable<BulkMenu["items"]> }[] {
  return (menu.categories ?? [])
    .map((c) => ({
      name: c.name,
      items: (menu.items ?? []).filter((i) => i.category === c.key),
    }))
    .filter((c) => c.items.length > 0);
}
