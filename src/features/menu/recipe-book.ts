/**
 * The recipe export: every drink's recipe as its own table.
 *
 * The data is ONE read, `GET /recipes/book`, which hands back each item
 * already laid out (sizes as columns, ingredients as rows in the Studio grid's
 * order, each size's cost and food cost from the server's own cost math). This
 * module only decides the words and the layout, and the file is drawn by the
 * shared export engine (`lib/excel.ts`), so the recipe book wears the same
 * banner, palette and bands as every other export.
 *
 * Two workbooks and a CSV come out of one book:
 * - **Recipes**: the tables with each size's cost, price and food cost under
 *   them, plus an "Ingredient lines" sheet with every line's cost.
 * - **Recipe cards** (`costs: false`): the same tables with no money at all,
 *   for printing at the bar.
 * - **CSV**: the "Ingredient lines" sheet alone, one row per item, size and
 *   ingredient.
 */
import type { TFunction } from "i18next";

import type { RecipeBook, RecipeCard, RecipeCardRow, RecipeCardSize } from "@/data/api/generated/models";
import type { AnySheet, ExcelBlock, ExcelCell, ExcelColumn, ExcelGroup, ExcelSheet } from "@/lib/excel";
import type { ExportSheet } from "@/components/app/export-button";
import { getTranslatedName } from "@/lib/translation";
import { ONE_SIZE } from "./util";

export interface RecipeBookOptions {
  /** With each size's cost, price and food cost, and each line's cost. */
  costs: boolean;
  lang: string;
  t: TFunction;
}

/** One line of the flat sheet (and the CSV). */
interface LineRow {
  category: string;
  item: string;
  size: string;
  ingredient: string;
  from: string;
  quantity: number | null;
  unit: string;
  lineCost: number | null;
}

/** Width of the label column, the unit column and each size column. */
const LABEL_WIDTH = 34;
const UNIT_WIDTH = 9;
const SIZE_WIDTH = 15;

/** An item has a recipe to print when it has a line or a step. */
const hasRecipe = (card: RecipeCard): boolean => card.rows.length > 0 || card.steps.length > 0;

export const sizeLabel = (s: Pick<RecipeCardSize, "label">, t: TFunction): string =>
  s.label === ONE_SIZE ? t("recipes.oneSize", "One size") : s.label;

/** A size's column header: its label, and that it is off the menu when it is. */
const sizeHeader = (s: RecipeCardSize, t: TFunction): string =>
  s.is_active ? sizeLabel(s, t) : `${sizeLabel(s, t)} (${t("recipeBook.off", "off")})`;

const unitLabel = (unit: string, t: TFunction): string => t(`units.${unit}`, unit);

/** Where a row came from, in words: the item itself says nothing. */
const fromLabel = (source: string, t: TFunction): string => {
  switch (source) {
    case "base":
      return t("recipeBook.from.base", "Recipe base");
    case "rule":
      return t("recipeBook.from.rule", "Packaging rule");
    case "linked":
      return t("recipeBook.from.linked", "Linked recipe");
    default:
      return t("recipeBook.from.own", "This item");
  }
};

/** A row's label in a table: a base's or a rule's line says so. */
const rowLabel = (row: RecipeCardRow, t: TFunction): string =>
  row.source === "base" || row.source === "rule" ? `${row.ingredient_name} (${fromLabel(row.source, t)})` : row.ingredient_name;

/** The words after an item's name: whose recipe it follows, that it is off the menu. */
const itemNote = (card: RecipeCard, t: TFunction): string | undefined => {
  const parts = [
    card.follows_item_name ? t("recipeBook.follows", { name: card.follows_item_name, defaultValue: "Follows {{name}}" }) : null,
    card.is_active ? null : t("common.inactive", "Inactive"),
  ].filter(Boolean);
  return parts.length ? parts.join("  ·  ") : undefined;
};

/** How it's made, one step a line, in the export's language. */
const stepsCaption = (card: RecipeCard, lang: string, t: TFunction): string | undefined => {
  if (!card.steps.length) return undefined;
  const ar = lang.startsWith("ar");
  const lines = card.steps.map((s, i) => {
    const name = (ar ? s.name_ar : s.name) || s.name || s.name_ar;
    const note = ar ? (s.note_ar ?? s.note) : (s.note ?? s.note_ar);
    return note ? `${i + 1}. ${name} — ${note}` : `${i + 1}. ${name}`;
  });
  return [t("recipeBook.howItsMade", "How it's made"), ...lines].join("\n");
};

/** The money under a table: cost, price and food cost per size. */
const costFooter = (card: RecipeCard, t: TFunction): ExcelCell[][] => {
  const cost: ExcelCell[] = [t("recipeBook.cost", "Cost"), null];
  const price: ExcelCell[] = [t("common.price", "Price"), null];
  const food: ExcelCell[] = [t("recipeBook.foodCost", "Food cost"), null];
  for (const s of card.sizes) {
    // A partial cost is still the sum of what is known; the food cost row says it is partial.
    cost.push(s.cost_piastres == null ? "—" : { value: s.cost_piastres, type: "money" });
    price.push({ value: s.price, type: "money" });
    food.push(
      s.food_cost_pct != null
        ? { value: s.food_cost_pct, type: "percent" }
        : s.cost_incomplete
          ? t("recipeBook.missingCosts", "Missing costs")
          : "—",
    );
  }
  return [cost, price, food];
};

/** One item's table. */
export function recipeBlock(card: RecipeCard, o: RecipeBookOptions): ExcelBlock {
  const { t, lang } = o;
  return {
    title: getTranslatedName(card, lang),
    note: itemNote(card, t),
    header: card.rows.length
      ? [t("recipeBook.ingredient", "Ingredient"), t("recipeBook.unit", "Unit"), ...card.sizes.map((s) => sizeHeader(s, t))]
      : [],
    rows: card.rows.map((row) => [
      rowLabel(row, t),
      unitLabel(row.unit, t),
      ...row.cells.map((c): ExcelCell => (c.quantity == null ? null : { value: c.quantity, type: "quantity" })),
    ]),
    footer: o.costs && card.rows.length ? costFooter(card, t) : undefined,
    caption: stepsCaption(card, lang, t),
  };
}

/** The flat sheet: every item × size × ingredient, in the book's order. */
export function recipeLinesSheet(book: RecipeBook, o: RecipeBookOptions): ExcelSheet<LineRow> {
  const { t, lang } = o;
  const categoryName = new Map(book.categories.map((c) => [c.id, getTranslatedName(c, lang)]));
  const rows: LineRow[] = [];
  for (const card of book.items) {
    const item = getTranslatedName(card, lang);
    const category = (card.category_id && categoryName.get(card.category_id)) || t("menu.uncategorised", "Uncategorised");
    card.sizes.forEach((size, col) => {
      for (const row of card.rows) {
        const cell = row.cells[col];
        if (cell?.quantity == null) continue;
        rows.push({
          category,
          item,
          size: sizeLabel(size, t),
          ingredient: row.ingredient_name,
          from: fromLabel(row.source, t),
          quantity: cell.quantity,
          unit: unitLabel(row.unit, t),
          lineCost: cell.line_cost_piastres ?? null,
        });
      }
    });
  }
  const columns: ExcelColumn<LineRow>[] = [
    { header: t("common.category", "Category"), accessor: (r) => r.category, type: "text", width: 20 },
    { header: t("recipeBook.item", "Item"), accessor: (r) => r.item, type: "text", width: 26 },
    { header: t("recipeBook.size", "Size"), accessor: (r) => r.size, type: "text", width: 14 },
    { header: t("recipeBook.ingredient", "Ingredient"), accessor: (r) => r.ingredient, type: "text", width: 26 },
    { header: t("recipeBook.fromHeader", "From"), accessor: (r) => r.from, type: "text", width: 16 },
    { header: t("recipeBook.quantity", "Quantity"), accessor: (r) => r.quantity, type: "quantity", width: 12 },
    { header: t("recipeBook.unit", "Unit"), accessor: (r) => r.unit, type: "text", width: 9 },
  ];
  if (o.costs) {
    columns.push({ header: t("recipeBook.lineCost", "Line cost"), accessor: (r) => r.lineCost, type: "money", width: 14 });
  }
  return {
    name: t("recipeBook.linesSheet", "Ingredient lines"),
    title: t("recipeBook.linesTitle", "Ingredient lines"),
    columns,
    rows,
  };
}

/**
 * The recipe workbook's sheets as the Export panel names them, in
 * `recipeBookSheets`' order: a PDF is one of them, a CSV the lines (the
 * tables are a sheet of tables).
 */
export const recipeBookSheetLabels = (t: TFunction): ExportSheet[] => [
  { label: t("recipeBook.sheetTables", "Recipe tables"), csv: false },
  t("recipeBook.linesSheet", "Ingredient lines"),
];

/** The recipe workbook's sheets: the tables, then the flat lines. */
export function recipeBookSheets(book: RecipeBook, o: RecipeBookOptions): AnySheet[] {
  const { t, lang } = o;
  const withRecipe = book.items.filter(hasRecipe);
  const without = book.items.filter((c) => !hasRecipe(c));

  // Categories in menu order, then the uncategorised, as the server sorts.
  const groups: ExcelGroup[] = [];
  const byCategory = new Map<string | null, ExcelBlock[]>();
  for (const card of withRecipe) {
    const key = card.category_id ?? null;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(recipeBlock(card, o));
  }
  for (const c of book.categories) {
    const blocks = byCategory.get(c.id);
    if (blocks) groups.push({ group: getTranslatedName(c, lang), blocks });
  }
  const loose = byCategory.get(null);
  if (loose) groups.push({ group: t("menu.uncategorised", "Uncategorised"), blocks: loose });

  // Items still without a recipe are a list at the end, not a page of empty tables.
  if (without.length) {
    const categoryName = new Map(book.categories.map((c) => [c.id, getTranslatedName(c, lang)]));
    groups.push({
      group: t("recipeBook.noRecipe", "No recipe yet"),
      blocks: [
        {
          title: t("recipeBook.noRecipeTitle", { count: without.length, defaultValue: "{{count}} items" }),
          header: [t("recipeBook.item", "Item")],
          rows: without.map((c) => {
            const cat = c.category_id ? categoryName.get(c.category_id) : undefined;
            return [cat ? `${getTranslatedName(c, lang)}  ·  ${cat}` : getTranslatedName(c, lang)];
          }),
        },
      ],
    });
  }

  const maxSizes = Math.max(1, ...withRecipe.map((c) => c.sizes.length));
  const stats: { label: string; value: number; type: "number" }[] = [
    { label: t("recipeBook.stats.items", "Items"), value: book.items.length, type: "number" },
    { label: t("recipeBook.stats.withRecipe", "With a recipe"), value: withRecipe.length, type: "number" },
    { label: t("recipeBook.stats.noRecipe", "No recipe yet"), value: without.length, type: "number" },
  ];
  if (o.costs) {
    stats.push({
      label: t("recipeBook.stats.missingCosts", "Sizes missing costs"),
      value: withRecipe.reduce((n, c) => n + c.sizes.filter((s) => s.cost_incomplete).length, 0),
      type: "number",
    });
  }

  const title = o.costs ? t("recipeBook.title", "Recipes") : t("recipeBook.cardsTitle", "Recipe cards");
  const tables: AnySheet = {
    kind: "blocks",
    name: title,
    title,
    stats,
    widths: [LABEL_WIDTH, UNIT_WIDTH, ...Array<number>(maxSizes).fill(SIZE_WIDTH)],
    groups,
  };
  return [tables, recipeLinesSheet(book, o) as unknown as ExcelSheet<Record<string, unknown>>];
}

/** The subtitle line: what the Items page was filtered to. */
export function recipeBookMeta(
  f: { category?: string; search?: string; recipe?: string },
  t: TFunction,
): string | undefined {
  const parts = [
    f.category,
    f.search ? `“${f.search}”` : undefined,
    f.recipe === "has" ? t("menu.recipeHas", "Has a recipe") : f.recipe === "missing" ? t("menu.recipeMissing", "No recipe") : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join("  ·  ") : undefined;
}
