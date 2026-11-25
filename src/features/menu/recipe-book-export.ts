/**
 * Fetch the recipe book for the Items page's filters and save it: the recipe
 * workbook (with or without costs) or its CSV. The words and layout are
 * `recipe-book.ts`; the file is the shared engine's (`lib/excel.ts`).
 */
import type { TFunction } from "i18next";

import { getRecipeBook } from "@/data/api/generated/api";
import type { GetRecipeBookParams } from "@/data/api/generated/models";
import { exportToCsv, exportToExcel, toastExportError } from "@/lib/excel";
import { EXPORT_REQUEST } from "@/lib/export-all";
import { recipeBookSheets, recipeLinesSheet } from "./recipe-book";

export type RecipeExportKind = "recipes" | "cards" | "csv";

export interface RecipeExportContext {
  params: GetRecipeBookParams;
  /** The subtitle: what the page was filtered to. */
  meta?: string;
  logoUrl?: string;
  lang: string;
  t: TFunction;
}

/** File names, as every export's: `<name>-<shop's today>.<ext>`. */
const FILENAME: Record<RecipeExportKind, string> = {
  recipes: "Madar-Recipes",
  cards: "Madar-Recipe-Cards",
  csv: "Madar-Recipe-Lines",
};

/**
 * Toasts once and rethrows on failure, as every export handler does, so the
 * button shakes.
 */
export async function exportRecipeBook(kind: RecipeExportKind, ctx: RecipeExportContext): Promise<void> {
  const { t, lang } = ctx;
  try {
    const book = await getRecipeBook(ctx.params, EXPORT_REQUEST);
    const opts = { costs: kind !== "cards", lang, t };
    if (kind === "csv") {
      await exportToCsv({
        filename: FILENAME.csv,
        sheets: [recipeLinesSheet(book, opts) as unknown as Parameters<typeof exportToCsv>[0]["sheets"][number]],
      });
      return;
    }
    const count = book.items.length;
    await exportToExcel({
      filename: FILENAME[kind],
      meta: ctx.meta,
      logoUrl: ctx.logoUrl,
      sheets: recipeBookSheets(book, opts),
      doneMessage: t("recipeBook.done", { count: count, defaultValue: "Exported {{count}} recipes" }),
    });
  } catch (e) {
    toastExportError(e);
    throw e;
  }
}
