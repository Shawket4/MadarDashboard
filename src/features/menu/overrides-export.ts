import type { QueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";

import { exportToExcel, type ExcelColumn, type ExcelSheet } from "@/lib/excel";
import { fetchAllAddonCatalog, fetchAllMenuCatalog } from "@/lib/catalog-fetch";
import { piastresToEgp } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import type {
  BranchAddonOverride,
  BranchMenuOverride,
  Category,
} from "@/data/api/generated/models";

type AnySheet = ExcelSheet<Record<string, unknown>>;
const asSheet = <T>(s: ExcelSheet<T>): AnySheet => s as unknown as AnySheet;

interface ItemRow {
  category: string;
  name: string;
  orgPrice: number;
  branchPrice: number | null;
  availability: string;
  sizes: string;
  updated: string;
}

interface AddonRow {
  name: string;
  orgPrice: number;
  branchPrice: number | null;
  availability: string;
  updated: string;
}

export interface BranchOverridesExportCtx {
  qc: QueryClient;
  orgId: string;
  branchId: string;
  branchName: string;
  lang: string;
  t: TFunction;
  categories: Category[];
  itemOverrides: BranchMenuOverride[];
  addonOverrides: BranchAddonOverride[];
}

/**
 * Export the scoped branch's menu + add-on overrides to a two-sheet workbook.
 * The override lists carry only ids + prices, so we pull names/org prices for the
 * overridden catalog (overridden-only keeps the fetch small) and join locally.
 */
export async function exportBranchOverrides(ctx: BranchOverridesExportCtx): Promise<void> {
  const { qc, orgId, branchId, branchName, lang, t, categories, itemOverrides, addonOverrides } = ctx;

  const [items, addons] = await Promise.all([
    fetchAllMenuCatalog(qc, { org_id: orgId, branch_id: branchId, overridden: true }),
    fetchAllAddonCatalog(qc, { org_id: orgId, branch_id: branchId, overridden: true }),
  ]);
  const itemById = new Map(items.map((i) => [i.id, i]));
  const addonById = new Map(addons.map((a) => [a.id, a]));
  const catById = new Map(categories.map((c) => [c.id, c]));

  const avail = (b: boolean) => (b ? t("delivery.available", "Available") : t("delivery.hidden", "Hidden"));

  const itemRows: ItemRow[] = itemOverrides
    .map((o) => {
      const it = itemById.get(o.menu_item_id);
      const cat = it?.category_id ? catById.get(it.category_id) : undefined;
      const sizes = (o.sizes ?? [])
        .map((s) => `${s.size_label}: ${piastresToEgp(s.price_override).toFixed(2)}`)
        .join(", ");
      return {
        category: cat ? getTranslatedName(cat, lang) : "—",
        name: it ? getTranslatedName(it, lang) : o.menu_item_id,
        orgPrice: it?.base_price ?? 0,
        branchPrice: o.price_override ?? null,
        availability: avail(o.is_available),
        sizes,
        updated: o.updated_at,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  const addonRows: AddonRow[] = addonOverrides
    .map((o) => {
      const a = addonById.get(o.addon_item_id);
      return {
        name: a ? getTranslatedName(a, lang) : o.addon_item_id,
        orgPrice: a?.default_price ?? 0,
        branchPrice: o.price_override ?? null,
        availability: avail(o.is_available),
        updated: o.updated_at,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  const itemCols: ExcelColumn<ItemRow>[] = [
    { header: t("common.category", "Category"), accessor: (r) => r.category, type: "text", width: 22 },
    { header: t("common.name", "Name"), accessor: (r) => r.name, type: "text", width: 30 },
    { header: t("menu.overrides.colOrgPrice", "Org price"), accessor: (r) => r.orgPrice, type: "money", width: 16 },
    { header: t("menu.overrides.colBranchPrice", "Branch price"), accessor: (r) => r.branchPrice, type: "money", width: 16 },
    { header: t("menu.overrides.colAvailability", "Availability"), accessor: (r) => r.availability, type: "text", width: 14 },
    { header: t("menu.overrides.colSizeOverrides", "Size overrides"), accessor: (r) => r.sizes, type: "text", width: 34 },
    { header: t("menu.overrides.colUpdated", "Updated"), accessor: (r) => r.updated, type: "dateTime", width: 22 },
  ];

  const addonCols: ExcelColumn<AddonRow>[] = [
    { header: t("common.name", "Name"), accessor: (r) => r.name, type: "text", width: 30 },
    { header: t("menu.overrides.colOrgPrice", "Org price"), accessor: (r) => r.orgPrice, type: "money", width: 16 },
    { header: t("menu.overrides.colBranchPrice", "Branch price"), accessor: (r) => r.branchPrice, type: "money", width: 16 },
    { header: t("menu.overrides.colAvailability", "Availability"), accessor: (r) => r.availability, type: "text", width: 14 },
    { header: t("menu.overrides.colUpdated", "Updated"), accessor: (r) => r.updated, type: "dateTime", width: 22 },
  ];

  const subtitle = t("menu.overrides.exportSubtitle", { branch: branchName, defaultValue: `Branch: ${branchName}` });

  await exportToExcel({
    filename: `Madar-Branch-Overrides-${branchName}`.replace(/\s+/g, "-"),
    meta: subtitle,
    sheets: [
      asSheet({
        name: t("menu.overrides.menuItems", "Menu items"),
        title: t("menu.overrides.exportItemsSheet", "Menu item overrides"),
        subtitle,
        columns: itemCols,
        rows: itemRows,
      }),
      asSheet({
        name: t("menu.overrides.addonItems", "Add-on items"),
        title: t("menu.overrides.exportAddonsSheet", "Add-on overrides"),
        subtitle,
        columns: addonCols,
        rows: addonRows,
      }),
    ],
  });
}
