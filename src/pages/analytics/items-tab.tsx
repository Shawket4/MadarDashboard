import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { Coffee } from "lucide-react";
import { DataTable } from "@/shared/ui/data-table";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { Progress } from "@/shared/ui/progress";
import { Badge } from "@/shared/ui/badge";
import { useBranchSales, useBranchAddonSales as useBranchAddons } from "@/shared/api/generated/api";
import { fmtMoney, fmtNumber } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import { getTranslatedName } from "@/shared/lib/translation";
import type { AddonSalesRow, ItemSales } from "@/shared/types";
import { ChartCard } from "./chart-card";



export function ItemsTab({ branchId, from, to }: { branchId: string; from: string | null; to: string | null }) {
  const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ void i18n.language;
  const { data: sales, isLoading } = useBranchSales(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });
  const { data: addons = [] } = useBranchAddons(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });

  const cols: ColumnDef<ItemSales>[] = [
    { accessorKey: "item_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{getTranslatedName({ name: row.original.item_name, name_translations: row.original.item_name_translations }, i18n.language)}</span> },
    { accessorKey: "quantity_sold", header: t("common.qty"), cell: ({ row }) => <span className="tabular text-sm">{fmtNumber(row.original.quantity_sold)}</span> },
    { accessorKey: "revenue", header: t("orders.totalRevenue"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{fmtMoney(row.original.revenue)}</span> },
  ];

  const addonCols: ColumnDef<AddonSalesRow>[] = [
    { accessorKey: "addon_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{getTranslatedName({ name: row.original.addon_name, name_translations: row.original.addon_name_translations }, i18n.language)}</span> },
    { accessorKey: "addon_type", header: t("common.type"), cell: ({ row }) => <Badge variant="outline">{t(`menu.addonTypes.${row.original.addon_type}`, { defaultValue: row.original.addon_type })}</Badge> },
    { accessorKey: "quantity_sold", header: t("common.qty"), cell: ({ row }) => <span className="tabular text-sm">{fmtNumber(row.original.quantity_sold)}</span> },
    { accessorKey: "revenue", header: t("orders.totalRevenue"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{fmtMoney(row.original.revenue)}</span> },
  ];

  const exportItems = () => {
    if (!sales) return;
    exportToExcel({
      filename: "Items",
      sheets: [
        {
          name: "Items",
          title: t("analytics.topItemsRev"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (i: ItemSales) => getTranslatedName({ name: i.item_name, name_translations: i.item_name_translations }, i18n.language), width: 30 },
            { key: "qty", header: t("common.qty"), accessor: (i: ItemSales) => i.quantity_sold, type: "integer", width: 12, total: true },
            { key: "rev", header: t("orders.totalRevenue"), accessor: (i: ItemSales) => i.revenue, type: "money", width: 16, total: true },
          ],
          rows: sales.top_items,
          totals: true,
        },
        {
          name: "Addons",
          title: t("analytics.addonSales"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (a: AddonSalesRow) => getTranslatedName({ name: a.addon_name, name_translations: a.addon_name_translations }, i18n.language), width: 28 },
            { key: "type", header: t("common.type"), accessor: (a: AddonSalesRow) => t(`menu.addonTypes.${a.addon_type}`, { defaultValue: a.addon_type }), width: 16 },
            { key: "qty", header: t("common.qty"), accessor: (a: AddonSalesRow) => a.quantity_sold, type: "integer", width: 12, total: true },
            { key: "rev", header: t("orders.totalRevenue"), accessor: (a: AddonSalesRow) => a.revenue, type: "money", width: 16, total: true },
          ],
          rows: addons,
          totals: true,
        },
      ],
    });
  };

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!sales || sales.top_items.length === 0) return <EmptyState icon={Coffee} title={t("analytics.noData")} />;

  const totalCatRevenue = sales.by_category.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.topItemsRev")} onExport={exportItems}>
        <DataTable columns={cols} data={sales.top_items} searchKey="item_name" pageSize={10} />
      </ChartCard>

      <ChartCard title={t("analytics.byCategory")}>
        <div className="space-y-3">
          {sales.by_category.map((c) => (
            <div key={c.category_id ?? "none"} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {c.category_name ?? t("menu.uncategorised")}
                  <span className="text-muted-foreground text-xs ms-2">×{c.quantity_sold}</span>
                </span>
                <span className="tabular font-semibold">{fmtMoney(c.revenue)}</span>
              </div>
              <Progress value={totalCatRevenue ? (c.revenue / totalCatRevenue) * 100 : 0} />
            </div>
          ))}
        </div>
      </ChartCard>

      {addons.length > 0 && (
        <ChartCard title={t("analytics.addonSales")}>
          <DataTable columns={addonCols} data={addons} searchKey="addon_name" pageSize={10} />
        </ChartCard>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tellers Tab
// ─────────────────────────────────────────────────────────────────────────────
