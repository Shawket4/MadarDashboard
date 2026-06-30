import type { QueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";

import { exportToExcel, type ExcelColumn, type ExcelSheet } from "@/lib/excel";
import { fetchAllAddonCatalog, fetchAllMenuCatalog } from "@/lib/catalog-fetch";
import { getTranslatedName } from "@/lib/translation";
import type {
  ChannelAddonOverride,
  ChannelMenuOverride,
} from "@/data/api/generated/models";

type Channel = "in_mall" | "outside" | "umbrella" | "pickup";

type AnySheet = ExcelSheet<Record<string, unknown>>;
const asSheet = <T>(s: ExcelSheet<T>): AnySheet => s as unknown as AnySheet;

interface ItemRow {
  name: string;
  orgPrice: number;
  channelPrice: number | null;
  availability: string;
}

interface AddonRow {
  name: string;
  orgPrice: number;
  channelPrice: number | null;
  availability: string;
}

export interface ChannelOverridesExportCtx {
  qc: QueryClient;
  orgId: string;
  branchName: string;
  channel: Channel;
  lang: string;
  t: TFunction;
  itemOverrides: ChannelMenuOverride[];
  addonOverrides: ChannelAddonOverride[];
}

/**
 * Export the selected channel's per-branch menu + add-on overrides to a two-sheet
 * workbook. Channel overrides can target any item, so we pull the full catalog for
 * names/org prices and join locally. `is_available === null` means "inherit".
 */
export async function exportChannelOverrides(ctx: ChannelOverridesExportCtx): Promise<void> {
  const { qc, orgId, branchName, channel, lang, t, itemOverrides, addonOverrides } = ctx;

  const [items, addons] = await Promise.all([
    fetchAllMenuCatalog(qc, { org_id: orgId }),
    fetchAllAddonCatalog(qc, { org_id: orgId }),
  ]);
  const itemById = new Map(items.map((i) => [i.id, i]));
  const addonById = new Map(addons.map((a) => [a.id, a]));

  const avail = (v: boolean | null | undefined) =>
    v == null
      ? t("menu.overrides.inherits", "Inherits")
      : v
        ? t("delivery.available", "Available")
        : t("delivery.hidden", "Hidden");

  const channelLabel =
    channel === "in_mall"
      ? t("delivery.inMall", "In-mall delivery")
      : channel === "umbrella"
        ? t("delivery.umbrella", "Umbrella delivery")
        : channel === "pickup"
          ? t("delivery.pickup", "Pickup")
          : t("delivery.outside", "Outside delivery");

  const itemRows: ItemRow[] = itemOverrides
    .map((o) => {
      const it = itemById.get(o.menu_item_id);
      return {
        name: it ? getTranslatedName(it, lang) : o.menu_item_id,
        orgPrice: it?.base_price ?? 0,
        channelPrice: o.price_override ?? null,
        availability: avail(o.is_available),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  const addonRows: AddonRow[] = addonOverrides
    .map((o) => {
      const a = addonById.get(o.addon_item_id);
      return {
        name: a ? getTranslatedName(a, lang) : o.addon_item_id,
        orgPrice: a?.default_price ?? 0,
        channelPrice: o.price_override ?? null,
        availability: avail(o.is_available),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  const itemCols: ExcelColumn<ItemRow>[] = [
    { header: t("common.name", "Name"), accessor: (r) => r.name, type: "text", width: 30 },
    { header: t("menu.overrides.colOrgPrice", "Org price"), accessor: (r) => r.orgPrice, type: "money", width: 16 },
    { header: t("delivery.colChannelPrice", "Channel price"), accessor: (r) => r.channelPrice, type: "money", width: 16 },
    { header: t("menu.overrides.colAvailability", "Availability"), accessor: (r) => r.availability, type: "text", width: 14 },
  ];

  const addonCols = itemCols as unknown as ExcelColumn<AddonRow>[];

  const subtitle = t("delivery.exportSubtitle", {
    branch: branchName,
    channel: channelLabel,
    defaultValue: `Branch: ${branchName} · Channel: ${channelLabel}`,
  });

  await exportToExcel({
    filename: `Madar-Channel-Overrides-${branchName}-${channel}`.replace(/\s+/g, "-"),
    meta: subtitle,
    sheets: [
      asSheet({
        name: t("delivery.menuItems", "Menu items"),
        title: t("delivery.exportItemsSheet", "Menu channel overrides"),
        subtitle,
        columns: itemCols,
        rows: itemRows,
      }),
      asSheet({
        name: t("delivery.addonItems", "Add-on items"),
        title: t("delivery.exportAddonsSheet", "Add-on channel overrides"),
        subtitle,
        columns: addonCols,
        rows: addonRows,
      }),
    ],
  });
}
