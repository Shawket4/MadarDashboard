import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/ui/data-table";
import { Badge } from "@/shared/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { fmtMoney, fmtPercent } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import type { MenuEngineeringRow } from "@/shared/api/generated/models";
import { CLASS_VARIANT, type MenuClass } from "./lib";

// Sort by business value, not alphabetically: stars first, dogs last;
// high before low for the categories. Higher rank = better, so the natural
// DESC sort puts Stars/High first. (Cost-missing rows are excluded
// server-side — every row arrives classified.)
const CLASS_RANK: Record<string, number> = { star: 4, workhorse: 3, challenge: 2, dog: 1 };
const LEVEL_RANK: Record<string, number> = { high: 2, low: 1 };
// nullable piastre columns: numeric sort with unknown (null) treated as the
// smallest value, so descending "biggest profit first" pushes them last
const numericSort =
  (key: keyof MenuEngineeringRow) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (a: any, b: any) => {
    const va = (a.original[key] as number | null) ?? Number.NEGATIVE_INFINITY;
    const vb = (b.original[key] as number | null) ?? Number.NEGATIVE_INFINITY;
    return va - vb;
  };

/** Realized margin over the window: total_profit / sales (null when cost unknown). */
const marginPct = (r: MenuEngineeringRow): number | null =>
  r.total_profit != null && r.sales > 0 ? r.total_profit / r.sales : null;

const rankSort =
  (ranks: Record<string, number>, key: keyof MenuEngineeringRow) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (a: any, b: any) => {
    const ra = ranks[String(a.original[key] ?? "")] ?? 0;
    const rb = ranks[String(b.original[key] ?? "")] ?? 0;
    return ra - rb;
  };

function ClassBadge({ cls }: { cls: string | null | undefined }) {
  const { t } = useTranslation();
  if (!cls) return <span className="text-muted-foreground text-xs">—</span>;
  return <Badge variant={CLASS_VARIANT[cls as MenuClass] ?? "secondary"}>{t(`menuEngineering.classes.${cls}`)}</Badge>;
}

export function TableView({ rows }: { rows: MenuEngineeringRow[] }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => {
      if (r.category_id && r.category_name) seen.set(r.category_id, r.category_name);
    });
    return [...seen.entries()];
  }, [rows]);

  const filtered = useMemo(
    () => rows.filter((r) => (category === "all" ? true : r.category_id === category)),
    [rows, category],
  );

  const cols: ColumnDef<MenuEngineeringRow>[] = [
    {
      accessorKey: "item_name",
      header: t("common.name"),
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-sm">{row.original.item_name}</span>
          {row.original.cost_missing_lines > 0 && (
            <Link
              to="/menu/recipes"
              onClick={(e) => e.stopPropagation()}
              className="block text-xs text-warning hover:underline underline-offset-2"
            >
              {t("menuEngineering.missingLines", { count: row.original.cost_missing_lines })}
            </Link>
          )}
        </div>
      ),
    },
    { accessorKey: "size_label", header: t("menuEngineering.size"), cell: ({ row }) => <span className="text-xs">{row.original.size_label === "one_size" ? "—" : row.original.size_label}</span> },
    { accessorKey: "sales", header: t("menuEngineering.sales"), cell: ({ row }) => <span className="tabular text-sm">{fmtMoney(row.original.sales)}</span> },
    { accessorKey: "quantity_sold", header: t("menuEngineering.quantity"), cell: ({ row }) => <span className="tabular text-sm">{row.original.quantity_sold}</span> },
    { accessorKey: "total_cost", header: t("menuEngineering.totalCost"), sortingFn: numericSort("total_cost"), cell: ({ row }) => <span className="tabular text-sm">{fmtMoney(row.original.total_cost)}</span> },
    { accessorKey: "item_profit", header: t("menuEngineering.itemProfit"), sortingFn: numericSort("item_profit"), cell: ({ row }) => <span className="tabular text-sm">{fmtMoney(row.original.item_profit)}</span> },
    { accessorKey: "total_profit", header: t("menuEngineering.totalProfit"), sortingFn: numericSort("total_profit"), cell: ({ row }) => <span className="tabular text-sm font-semibold">{fmtMoney(row.original.total_profit)}</span> },
    {
      id: "margin",
      header: t("menuEngineering.margin"),
      accessorFn: (r) => marginPct(r),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sortingFn: (a: any, b: any) =>
        (marginPct(a.original) ?? Number.NEGATIVE_INFINITY) - (marginPct(b.original) ?? Number.NEGATIVE_INFINITY),
      cell: ({ row }) => {
        const m = marginPct(row.original);
        return <span className="tabular text-sm">{m === null ? "—" : fmtPercent(m)}</span>;
      },
    },
    { accessorKey: "popularity_pct", header: t("menuEngineering.popularity"), cell: ({ row }) => <span className="tabular text-sm">{fmtPercent(row.original.popularity_pct)}</span> },
    {
      accessorKey: "profit_category",
      header: t("menuEngineering.profitCategory"),
      sortingFn: rankSort(LEVEL_RANK, "profit_category"),
      cell: ({ row }) =>
        row.original.profit_category ? (
          <span className="inline-flex items-center gap-1.5">
            <Badge variant={row.original.profit_category === "high" ? "success" : "secondary"}>
              {t(`menuEngineering.levels.${row.original.profit_category}`)}
            </Badge>
            {marginPct(row.original) !== null && (
              <span className="tabular text-xs text-muted-foreground">
                {fmtPercent(marginPct(row.original) as number)}
              </span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      accessorKey: "popularity_category",
      header: t("menuEngineering.popularityCategory"),
      sortingFn: rankSort(LEVEL_RANK, "popularity_category"),
      cell: ({ row }) => <Badge variant={row.original.popularity_category === "high" ? "success" : "secondary"}>{t(`menuEngineering.levels.${row.original.popularity_category}`)}</Badge>,
    },
    {
      accessorKey: "class",
      header: t("menuEngineering.class"),
      sortingFn: rankSort(CLASS_RANK, "class"),
      cell: ({ row }) => <ClassBadge cls={row.original.class} />,
    },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Menu-Engineering",
      sheets: [
        {
          name: "Menu Engineering",
          title: t("menuEngineering.title"),
          columns: [
            { key: "name", header: t("common.name"), accessor: (r: MenuEngineeringRow) => r.item_name, width: 26 },
            { key: "size", header: t("menuEngineering.size"), accessor: (r: MenuEngineeringRow) => (r.size_label === "one_size" ? "—" : r.size_label), width: 12 },
            { key: "category", header: t("common.category"), accessor: (r: MenuEngineeringRow) => r.category_name ?? "—", width: 16 },
            { key: "sales", header: t("menuEngineering.sales"), accessor: (r: MenuEngineeringRow) => r.sales, type: "money", width: 14, total: true },
            { key: "qty", header: t("menuEngineering.quantity"), accessor: (r: MenuEngineeringRow) => r.quantity_sold, type: "integer", width: 10, total: true },
            { key: "cost", header: t("menuEngineering.totalCost"), accessor: (r: MenuEngineeringRow) => r.total_cost, type: "money", width: 14, total: true },
            { key: "item_profit", header: t("menuEngineering.itemProfit"), accessor: (r: MenuEngineeringRow) => r.item_profit, type: "money", width: 14 },
            { key: "total_profit", header: t("menuEngineering.totalProfit"), accessor: (r: MenuEngineeringRow) => r.total_profit, type: "money", width: 14, total: true },
            { key: "margin", header: t("menuEngineering.margin"), accessor: (r: MenuEngineeringRow) => marginPct(r), type: "percent", width: 12 },
            { key: "popularity", header: t("menuEngineering.popularity"), accessor: (r: MenuEngineeringRow) => r.popularity_pct, type: "percent", width: 12 },
            { key: "class", header: t("menuEngineering.class"), accessor: (r: MenuEngineeringRow) => (r.class ? t(`menuEngineering.classes.${r.class}`) : "—"), width: 14 },
          ],
          rows: filtered,
          totals: true,
        },
      ],
    });

  return (
    <div className="space-y-3">
      {categories.length > 1 && (
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-9 w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("menuEngineering.allCategories")}</SelectItem>
            {categories.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <DataTable columns={cols} data={filtered} searchKey="item_name" onExport={handleExport} />
    </div>
  );
}
