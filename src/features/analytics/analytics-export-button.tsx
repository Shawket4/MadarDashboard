/**
 * The export for the Analytics tabs that put numbers in a table.
 *
 * Overview and Revenue are charts and KPI pills — a spreadsheet of a doughnut
 * is a made-up table — so this renders nothing there. The four tabs that do
 * show rows (Items, Tellers, Waiters, Branches) each get the columns they
 * display, in their order.
 *
 * The data is re-read here rather than lifted out of the tab components: the
 * report endpoints are cheap, re-reading declares the export intent the API
 * throttles on, and it keeps the tabs free of an "export" prop they would
 * otherwise have to thread up through the page.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ExportButton } from "@/components/app/export-button";
import {
  branchAddonSales, branchCombinedItemSales, branchTellerStats, branchWaiterStats,
  orgBranchComparison,
} from "@/data/api/generated/api";
import type {
  AddonSalesRow, BranchComparison, CombinedItemSalesRow, TellerStats, WaiterStats,
} from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import { exportToExcel, type ExcelColumn, type ExcelSheet } from "@/lib/excel";
import { EXPORT_REQUEST } from "@/lib/export-all";
import { tName } from "./lib";

/**
 * How many rows the export asks these reports for.
 *
 * The tables on screen are deliberate top-N cuts (fifty items, twenty addons)
 * and the endpoints take a `limit` with no offset, so the only way to ask for
 * the whole period is to ask for a bigger N. This one is far above any real
 * menu or roster and still an order of magnitude under the workbook ceiling in
 * `lib/export-all.ts`, so the file is the period rather than the leaderboard.
 */
// What the server will actually give: these reports clamp `limit`, and asking
// for more than the clamp returns the clamp with nothing to say it did.
// Matching it exactly means the file contains what was asked for.
const EXPORT_LIMIT = 1000;

type Sheets = ExcelSheet<Record<string, unknown>>[];

const EXPORTABLE = new Set<string>(["items", "tellers", "waiters", "branches"]);

export function AnalyticsExportButton({
  tab,
  branchId,
  orgId,
  range,
  periodLabel,
}: {
  tab: string;
  branchId: string;
  orgId: string;
  range: { from?: string; to?: string };
  periodLabel: string;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

  if (!EXPORTABLE.has(tab)) return null;

  const params = { ...range, limit: EXPORT_LIMIT };
  const cast = <T,>(rows: T[], columns: ExcelColumn<T>[]) => ({
    rows: rows as unknown as Record<string, unknown>[],
    columns: columns as unknown as ExcelColumn<Record<string, unknown>>[],
  });

  const itemsSheets = async (): Promise<Sheets> => {
    const [items, addons] = await Promise.all([
      branchCombinedItemSales(branchId, params, EXPORT_REQUEST),
      branchAddonSales(branchId, params, EXPORT_REQUEST),
    ]);
    const itemCols: ExcelColumn<CombinedItemSalesRow>[] = [
      { header: t("common.name", "Name"), accessor: (r) => tName(r.item_name, r.item_name_translations, lang), type: "text", width: 32 },
      { header: t("analytics.standalone", "Standalone"), accessor: (r) => r.standalone_qty, type: "number", width: 14, total: true },
      { header: t("analytics.inBundles", "In bundles"), accessor: (r) => r.bundle_qty, type: "number", width: 14, total: true },
      { header: t("analytics.totalSold", "Total sold"), accessor: (r) => r.total_qty, type: "number", width: 14, total: true },
    ];
    const addonCols: ExcelColumn<AddonSalesRow>[] = [
      { header: t("common.name", "Name"), accessor: (a) => tName(a.addon_name, a.addon_name_translations, lang), type: "text", width: 32 },
      { header: t("analytics.sold", "sold"), accessor: (a) => a.quantity_sold, type: "number", width: 14, total: true },
      { header: t("dashboard.revenue", "Revenue"), accessor: (a) => a.revenue, type: "money", width: 16, total: true },
    ];
    return [
      { name: t("analytics.tabs.items", "Items"), title: t("analytics.tabs.items", "Items"), totals: true, ...cast(items, itemCols) },
      { name: t("analytics.addonSales", "Addon Sales"), title: t("analytics.addonSales", "Addon Sales"), totals: true, ...cast(addons, addonCols) },
    ];
  };

  const tellersSheets = async (): Promise<Sheets> => {
    const rows = await branchTellerStats(branchId, params, EXPORT_REQUEST);
    const cols: ExcelColumn<TellerStats>[] = [
      { header: t("users.role", "Teller"), accessor: (r) => r.teller_name, type: "text", width: 26 },
      { header: t("dashboard.orders", "Orders"), accessor: (r) => r.orders, type: "integer", width: 12, total: true },
      { header: t("dashboard.revenue", "Revenue"), accessor: (r) => r.revenue, type: "money", width: 16, total: true },
      { header: t("analytics.aov", "AOV"), accessor: (r) => r.avg_order_value, type: "money", width: 14 },
      { header: t("orders.voided", "Voided"), accessor: (r) => r.voided, type: "integer", width: 12, total: true },
      { header: t("nav.shifts", "Shifts"), accessor: (r) => r.shifts, type: "integer", width: 12, total: true },
    ];
    const title = t("analytics.tellerDetails", "Teller Details");
    return [{ name: title, title, totals: true, ...cast(rows, cols) }];
  };

  const waitersSheets = async (): Promise<Sheets> => {
    const report = await branchWaiterStats(branchId, params, EXPORT_REQUEST);
    const cols: ExcelColumn<WaiterStats>[] = [
      { header: t("shifts.waiter", "Waiter"), accessor: (r) => r.waiter_name, type: "text", width: 26 },
      { header: t("dashboard.orders", "Orders"), accessor: (r) => r.orders, type: "integer", width: 12, total: true },
      { header: t("dashboard.revenue", "Revenue"), accessor: (r) => r.revenue, type: "money", width: 16, total: true },
      { header: t("analytics.aov", "AOV"), accessor: (r) => r.avg_order_value, type: "money", width: 14 },
      { header: t("analytics.itemsSold", "Items Sold"), accessor: (r) => r.line_items, type: "integer", width: 14, total: true },
      { header: t("analytics.itemsPerOrder", "Items / Order"), accessor: (r) => r.avg_items_per_order, type: "number", width: 14 },
      { header: t("orders.voided", "Voided"), accessor: (r) => r.voided, type: "integer", width: 12, total: true },
    ];
    const title = t("analytics.waiterDetails", "Waiter Details");
    return [{
      name: title,
      title,
      // The same caption the screen carries under the table: waiter-attributed
      // orders are a subset, so these totals are meant to fall short of the
      // branch's.
      subtitle: t("analytics.waiterCoverage", "{{attributed}} of {{total}} orders came through waiters", {
        attributed: report.attributed_orders,
        total: report.total_orders,
      }),
      totals: true,
      ...cast(report.waiters, cols),
    }];
  };

  const branchesSheets = async (): Promise<Sheets> => {
    const report = await orgBranchComparison(orgId, params, EXPORT_REQUEST);
    const cols: ExcelColumn<BranchComparison>[] = [
      { header: t("nav.branches", "Branch"), accessor: (b) => b.branch_name, type: "text", width: 26 },
      { header: t("dashboard.orders", "Orders"), accessor: (b) => b.total_orders, type: "integer", width: 12, total: true },
      { header: t("dashboard.revenue", "Revenue"), accessor: (b) => b.total_revenue, type: "money", width: 16, total: true },
      { header: t("analytics.aov", "AOV"), accessor: (b) => b.avg_order_value, type: "money", width: 14 },
      // `void_rate_pct` is a percentage number (12.3 = 12.3%); Excel's percent
      // format wants the ratio, so it is divided back down here.
      { header: t("analytics.voidRate", "Void Rate"), accessor: (b) => b.void_rate_pct / 100, type: "percent", width: 12 },
    ];
    const title = t("analytics.branchDetails", "Branch Details");
    return [{ name: title, title, totals: true, ...cast(report.branches, cols) }];
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const sheets = tab === "items"
        ? await itemsSheets()
        : tab === "tellers"
          ? await tellersSheets()
          : tab === "waiters"
            ? await waitersSheets()
            : await branchesSheets();
      await exportToExcel({
        filename: `Madar-Analytics-${tab}`,
        logoUrl,
        meta: periodLabel,
        sheets,
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const missingScope = tab === "branches" ? !orgId : !branchId;
  return <ExportButton onExport={handleExport} loading={exporting} disabled={missingScope} className="shrink-0" />;
}
