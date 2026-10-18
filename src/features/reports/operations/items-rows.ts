// The Items table's rows: three reads the dashboard already makes, joined on
// the menu item id (the Flutter dashboard's `opsItemRows` does the same):
//
// - units sold: the tab's own `items-combined` read;
// - revenue, the units behind it, and the category: the Overview's branch
//   sales report (`by_category[].items[]`, every item sold in the window, not
//   a top N), read with the Overview's own parameters so the cache is shared;
// - "Avg extra": the same report's per-item `extras_total` (what was charged
//   on top of the sizes' menu prices, before discounts, computed by the server
//   from the order lines) over its units;
// - the picture, the menu price (its active sizes: one price or a min–max
//   range) and the category of an item the report does not list: the full
//   menu items list the app already caches (`{ org_id, full: true }`, the
//   menu studio's and the combo editor's read).
//
// Nothing is estimated. An item the sales report does not list has no revenue,
// share or avg extra ("—", never 0): the two reads were fetched at different
// moments (an item first sold in between) or the report failed to list it.
// Its category then comes from the menu. A server older than the extras
// fields gives no avg extra either ("—"). The price is today's menu, not the
// prices it sold at.
import type { BranchSalesReport, CombinedItemSalesRow, ItemSize, MenuItem } from "@/data/api/generated/models";
import type { AssetGroupRef } from "@/components/app/asset-image";
import { tName } from "@/features/analytics/lib";
import { shareOf } from "./ranked-table-util";

export interface ItemRow {
  id: string;
  /** The name in the reader's language. */
  name: string;
  /** Every name the item goes by, for search. */
  names: string[];
  /** The category's name in the reader's language; null when nothing says. */
  category: string | null;
  /** The menu's picture (smallest ready variant, else the legacy address). */
  image: string | null;
  /** Units sold in the window (the items read). */
  units: number;
  /** Revenue in piastres (the sales report); null when the report does not list the item. */
  revenue: number | null;
  /** revenue over the table's known revenue, 0..1; null with no revenue. */
  share: number | null;
  /** The menu's price today, piastres: the cheapest and dearest active size (equal for one price); null off the menu. */
  price: { min: number; max: number } | null;
  /** Piastres per unit charged on top of the size's menu price (add-ons, swaps, options), before discounts; null when the report has no figure. */
  avgExtra: number | null;
}

/** A menu item as the full list sends it: the plain item plus its sizes. */
type MenuEntry = MenuItem & { sizes?: ItemSize[] | null; all_sizes?: ItemSize[] | null };

/** The menu price of an item: its active sizes' min and max, else its base price. */
export function menuPriceRange(m: MenuEntry | undefined): { min: number; max: number } | null {
  if (!m) return null;
  const rows = (m.all_sizes?.length ? m.all_sizes : m.sizes) ?? [];
  const prices = rows.filter((s) => s.is_active !== false && Number.isFinite(s.price_override)).map((s) => s.price_override);
  if (prices.length) return { min: Math.min(...prices), max: Math.max(...prices) };
  return Number.isFinite(m.base_price) ? { min: m.base_price, max: m.base_price } : null;
}

/** `n / d` rounded to the piastre, half away from zero (the server's rule); null when nothing sold. */
export function perUnit(n: number, d: number): number | null {
  if (!(d > 0) || !Number.isFinite(n)) return null;
  const q = Math.floor((2 * Math.abs(n) + d) / (2 * d));
  return n < 0 ? -q : q;
}

/** The menu's picture of an item: a ready asset group's thumb, tile or full, else `image_url`. */
export function menuImageUrl(m: Pick<MenuItem, "image" | "image_url"> | undefined): string | null {
  const image = m?.image as AssetGroupRef | null | undefined;
  if (image && image.status !== "processing") {
    const v = image.variants;
    const url = (v.thumb ?? v.tile ?? v.full)?.url;
    if (url) return url;
  }
  return m?.image_url || null;
}

const namesOf = (name: string, translations: unknown): string[] => [
  name,
  ...Object.values((translations ?? {}) as Record<string, unknown>).filter((v): v is string => typeof v === "string"),
];

export function itemRows({
  items,
  sales,
  menu,
  lang,
}: {
  items: readonly CombinedItemSalesRow[];
  sales: BranchSalesReport | undefined;
  menu: readonly MenuEntry[] | undefined;
  lang: string;
}): ItemRow[] {
  // The report, by item (an item renamed mid-window is listed once per name:
  // summed). `extras` stays null once any of its rows lacks the field.
  const sold = new Map<string, { revenue: number; qty: number; extras: number | null; category: string | null }>();
  // Category names by id, for items the report does not list.
  const categoryName = new Map<string, string>();
  for (const cat of sales?.by_category ?? []) {
    const name = cat.category_name ? tName(cat.category_name, cat.category_name_translations, lang) : null;
    if (cat.category_id && name) categoryName.set(cat.category_id, name);
    for (const it of cat.items) {
      const prev = sold.get(it.menu_item_id);
      const extras = typeof it.extras_total === "number" ? it.extras_total : null;
      sold.set(it.menu_item_id, {
        revenue: (prev?.revenue ?? 0) + it.revenue,
        qty: (prev?.qty ?? 0) + it.quantity_sold,
        extras: prev && prev.extras === null ? null : extras === null ? null : (prev?.extras ?? 0) + extras,
        category: prev?.category ?? name,
      });
    }
  }
  const menuById = new Map((menu ?? []).map((m) => [m.id, m]));

  // The items read groups by id and name, so a renamed item can come twice: one row each id.
  const merged = new Map<string, { row: CombinedItemSalesRow; units: number; names: string[] }>();
  for (const r of items) {
    const prev = merged.get(r.item_id);
    const names = namesOf(r.item_name, r.item_name_translations);
    if (prev) {
      prev.units += r.total_qty;
      prev.names.push(...names);
    } else merged.set(r.item_id, { row: r, units: r.total_qty, names });
  }

  const total = [...merged.keys()].reduce((s, id) => s + (sold.get(id)?.revenue ?? 0), 0);
  return [...merged.values()].map(({ row: r, units, names }) => {
    const s = sold.get(r.item_id);
    const m = menuById.get(r.item_id);
    const fromMenu = m?.category_id ? (categoryName.get(m.category_id) ?? null) : null;
    return {
      id: r.item_id,
      name: tName(r.item_name, r.item_name_translations, lang),
      names,
      category: s?.category ?? fromMenu,
      image: menuImageUrl(m),
      units,
      revenue: s ? s.revenue : null,
      share: s ? shareOf(s.revenue, total) : null,
      price: menuPriceRange(m),
      avgExtra: s && s.extras !== null ? perUnit(s.extras, s.qty) : null,
    };
  });
}
