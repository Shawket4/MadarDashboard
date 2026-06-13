import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { ColumnDef, Row } from "@tanstack/react-table";

import { DataTable } from "@/components/app/data-table";
import { ExportButton } from "@/components/app/export-button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fmtMoney, fmtPercent } from "@/lib/format";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import type { MenuEngineeringRow } from "@/data/api/generated/models";
import { CLASS_BADGE, marginPct, type MenuClass } from "./lib";

const CLASS_RANK: Record<string, number> = { star: 4, workhorse: 3, challenge: 2, dog: 1 };
const LEVEL_RANK: Record<string, number> = { high: 2, low: 1 };
const rankSort = (ranks: Record<string, number>, key: keyof MenuEngineeringRow) => (a: Row<MenuEngineeringRow>, b: Row<MenuEngineeringRow>) =>
  (ranks[String(a.original[key] ?? "")] ?? 0) - (ranks[String(b.original[key] ?? "")] ?? 0);

function LevelBadge({ level }: { level: string }) {
  const { t } = useTranslation();
  return <Badge variant="outline" className={cn(level === "high" && "border-transparent bg-success/15 text-success")}>{t(`menuEngineering.levels.${level}`, level)}</Badge>;
}

export function TableView({ rows }: { rows: MenuEngineeringRow[] }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => { if (r.category_id && r.category_name) seen.set(r.category_id, r.category_name); });
    return [...seen.entries()];
  }, [rows]);
  const filtered = useMemo(() => rows.filter((r) => (category === "all" ? true : r.category_id === category)), [rows, category]);

  const columns = useMemo<ColumnDef<MenuEngineeringRow>[]>(
    () => [
      {
        accessorKey: "item_name", header: t("common.name", "Name"),
        cell: ({ row }) => (
          <div>
            <span className="text-sm font-semibold">{row.original.item_name}</span>
            {row.original.cost_missing_lines > 0 ? (
              <Link to="/menu/recipes" onClick={(e) => e.stopPropagation()} className="block text-xs text-warning underline-offset-2 hover:underline">
                {t("menuEngineering.missingLines", { count: row.original.cost_missing_lines, defaultValue: `${row.original.cost_missing_lines} lines missing cost` })}
              </Link>
            ) : null}
          </div>
        ),
      },
      { accessorKey: "size_label", header: t("menuEngineering.size", "Size"), cell: ({ row }) => <span className="text-xs">{row.original.size_label === "one_size" ? "—" : row.original.size_label}</span> },
      { accessorKey: "sales", header: t("menuEngineering.sales", "Sales"), cell: ({ row }) => <span className="text-sm tabular">{fmtMoney(row.original.sales)}</span> },
      { accessorKey: "quantity_sold", header: t("menuEngineering.quantity", "Qty"), cell: ({ row }) => <span className="text-sm tabular">{row.original.quantity_sold}</span> },
      { accessorKey: "total_cost", header: t("menuEngineering.totalCost", "Total Cost"), cell: ({ row }) => <span className="text-sm tabular">{fmtMoney(row.original.total_cost)}</span> },
      { accessorKey: "item_profit", header: t("menuEngineering.itemProfit", "Item Profit"), cell: ({ row }) => <span className="text-sm tabular">{fmtMoney(row.original.item_profit)}</span> },
      { accessorKey: "total_profit", header: t("menuEngineering.totalProfit", "Total Profit"), cell: ({ row }) => <span className="text-sm font-semibold tabular">{fmtMoney(row.original.total_profit)}</span> },
      {
        id: "margin", header: t("menuEngineering.margin", "Margin %"),
        accessorFn: (r) => marginPct(r) ?? -Infinity,
        cell: ({ row }) => { const m = marginPct(row.original); return <span className="text-sm tabular">{m === null ? "—" : fmtPercent(m)}</span>; },
      },
      { accessorKey: "popularity_pct", header: t("menuEngineering.popularity", "Popularity"), cell: ({ row }) => <span className="text-sm tabular">{fmtPercent(row.original.popularity_pct)}</span> },
      { accessorKey: "profit_category", header: t("menuEngineering.profitCategory", "Profit"), sortingFn: rankSort(LEVEL_RANK, "profit_category"), cell: ({ row }) => <LevelBadge level={row.original.profit_category} /> },
      { accessorKey: "popularity_category", header: t("menuEngineering.popularityCategory", "Popularity"), sortingFn: rankSort(LEVEL_RANK, "popularity_category"), cell: ({ row }) => <LevelBadge level={row.original.popularity_category} /> },
      { accessorKey: "class", header: t("menuEngineering.class", "Class"), sortingFn: rankSort(CLASS_RANK, "class"), cell: ({ row }) => <Badge variant="outline" className={CLASS_BADGE[row.original.class as MenuClass] ?? ""}>{t(`menuEngineering.classes.${row.original.class}`, row.original.class)}</Badge> },
    ],
    [t],
  );

  const handleExport = () => {
    const cols: ExcelColumn<MenuEngineeringRow>[] = [
      { header: t("common.name", "Name"), accessor: (r) => r.item_name, type: "text", width: 26 },
      { header: t("menuEngineering.size", "Size"), accessor: (r) => (r.size_label === "one_size" ? "—" : r.size_label), type: "text", width: 12 },
      { header: t("common.category", "Category"), accessor: (r) => r.category_name ?? "—", type: "text", width: 16 },
      { header: t("menuEngineering.sales", "Sales"), accessor: (r) => r.sales, type: "money", width: 14, total: true },
      { header: t("menuEngineering.quantity", "Qty"), accessor: (r) => r.quantity_sold, type: "integer", width: 10, total: true },
      { header: t("menuEngineering.totalCost", "Total Cost"), accessor: (r) => r.total_cost, type: "money", width: 14, total: true },
      { header: t("menuEngineering.totalProfit", "Total Profit"), accessor: (r) => r.total_profit, type: "money", width: 14, total: true },
      { header: t("menuEngineering.popularity", "Popularity"), accessor: (r) => r.popularity_pct, type: "percent", width: 12 },
      { header: t("menuEngineering.class", "Class"), accessor: (r) => t(`menuEngineering.classes.${r.class}`, r.class), type: "text", width: 14 },
    ];
    void exportToExcel({ filename: "Sufrix-Menu-Engineering", sheets: [{ name: t("menuEngineering.title", "Menu Engineering"), title: t("menuEngineering.title", "Menu Engineering"), rows: filtered as unknown as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[], totals: true }] });
  };

  return (
    <DataTable
      columns={columns}
      data={filtered}
      getRowId={(r) => `${r.menu_item_id}:${r.size_label}`}
      searchPlaceholder={t("common.search", "Search…")}
      toolbar={
        <>
          {categories.length > 1 ? (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-auto min-w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("menuEngineering.allCategories", "All categories")}</SelectItem>
                {categories.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}
          <ExportButton onExport={handleExport} size="sm" />
        </>
      }
    />
  );
}
