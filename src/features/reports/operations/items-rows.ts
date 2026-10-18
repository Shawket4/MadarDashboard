// The Items table's rows: three reads the dashboard already makes, joined on
// the menu item id (the Flutter dashboard's `opsItemRows` does the same):
//
// - units sold: the tab's own `items-combined` read;
// - revenue, the units behind it, and the category: the Overview's branch
//   sales report (`by_category[].items[]`, every item sold in the window, not
//   a top N), read with the Overview's own parameters so the cache is shared;
// - the picture, and the category of an item the report does not list: the
//   menu items list the app already caches.
//
// Nothing is estimated. An item the sales report does not list has no revenue,
// share or average price ("—", never 0): the two reads were fetched at
// different moments (an item first sold in between) or the report failed to
// list it. Its category then comes from the menu.
import type { BranchSalesReport, CombinedItemSalesRow, MenuItem } from "@/data/api/generated/models";
import type { AssetGroupRef } from "@/components/app/asset-image";
import { tName } from "@/features/analytics/lib";
import { avgPrice, shareOf } from "./ranked-table-util";

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
  /** revenue over the report's units for the item; null with none. */
  avgPrice: number | null;
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
  menu: readonly MenuItem[] | undefined;
  lang: string;
}): ItemRow[] {
  // The report, by item (an item renamed mid-window is listed once per name: summed).
  const sold = new Map<string, { revenue: number; qty: number; category: string | null }>();
  // Category names by id, for items the report does not list.
  const categoryName = new Map<string, string>();
  for (const cat of sales?.by_category ?? []) {
    const name = cat.category_name ? tName(cat.category_name, cat.category_name_translations, lang) : null;
    if (cat.category_id && name) categoryName.set(cat.category_id, name);
    for (const it of cat.items) {
      const prev = sold.get(it.menu_item_id);
      sold.set(it.menu_item_id, {
        revenue: (prev?.revenue ?? 0) + it.revenue,
        qty: (prev?.qty ?? 0) + it.quantity_sold,
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
      avgPrice: s ? avgPrice(s.revenue, s.qty) : null,
    };
  });
}
