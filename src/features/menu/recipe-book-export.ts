/**
 * Fetch the recipe book for the Items page's filters and save it, with or
 * without costs, in the format chosen in the Export panel: the workbook, a PDF
 * of the tables or of the lines, or the lines as a CSV (the tables are a sheet
 * of tables, which has no CSV). The words and layout are `recipe-book.ts`; the
 * file is the shared engine's (`lib/excel.ts`).
 */
import type { TFunction } from "i18next";

import { getRecipeBook } from "@/data/api/generated/api";
import type { GetRecipeBookParams } from "@/data/api/generated/models";
import { exportFile, toastExportError } from "@/lib/excel";
import { EXPORT_REQUEST } from "@/lib/export-all";
import type { ExportPick } from "@/lib/export-format";
import { recipeBookSheets } from "./recipe-book";

/** With costs (for the owner) or the recipe cards (for the bar: no money anywhere). */
export type RecipeExportKind = "recipes" | "cards";

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
};

/**
 * Toasts once and rethrows on failure, as every export handler does, so the
 * button shakes.
 */
export async function exportRecipeBook(kind: RecipeExportKind, ctx: RecipeExportContext, pick?: ExportPick): Promise<void> {
  const { t, lang } = ctx;
  try {
    const book = await getRecipeBook(ctx.params, EXPORT_REQUEST);
    const count = book.items.length;
    await exportFile(
      {
        filename: FILENAME[kind],
        meta: ctx.meta,
        logoUrl: ctx.logoUrl,
        sheets: recipeBookSheets(book, { costs: kind === "recipes", lang, t }),
        doneMessage: t("recipeBook.done", { count: count, defaultValue: "Exported {{count}} recipes" }),
      },
      pick,
    );
  } catch (e) {
    toastExportError(e);
    throw e;
  }
}
