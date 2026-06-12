import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";
import { BarChart2 } from "lucide-react";
import { DataTable } from "@/shared/ui/data-table";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { ChartTooltip } from "@/shared/ui/chart-tooltip";
import { useOrgBranchComparison as useOrgComparison } from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { fmtMoney, fmtMoneyCompact } from "@/shared/lib/format";
import { exportToExcel,  } from "@/shared/lib/excel";
import type { BranchComparison } from "@/shared/types";
import { ChartCard } from "./chart-card";


const CHART_HEIGHT = 300;

export function BranchesTab({ orgId, from, to }: { orgId: string; from: string | null; to: string | null }) {
  const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ void i18n.language;
  const { activeMethods, getLabel, colorMap } = usePaymentMethods();
  const { data: report, isLoading } = useOrgComparison(orgId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!orgId } });

  const cols: ColumnDef<BranchComparison>[] = [
    { accessorKey: "branch_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{row.original.branch_name}</span> },
    { accessorKey: "total_orders", header: t("dashboard.orders") },
    { accessorKey: "voided_orders", header: t("orderStatus.voided") },
    { accessorKey: "avg_order_value", header: t("analytics.aov"), cell: ({ row }) => <span className="tabular">{fmtMoney(row.original.avg_order_value)}</span> },
    ...activeMethods.map((m) => ({
      id: `${m.name}_revenue`,
      header: getLabel(m.name),
      cell: ({ row }: { row: { original: BranchComparison } }) => <span className="tabular text-sm">{fmtMoney((row.original.revenue_by_method as Record<string, number>)?.[m.name] ?? 0)}</span>,
    })),
    { accessorKey: "total_revenue", header: t("orders.totalRevenue"), cell: ({ row }) => <span className="tabular font-semibold text-sm">{fmtMoney(row.original.total_revenue)}</span> },
  ];

  const chartData = report?.branches.map((b) => {
    const base: Record<string, any> = { name: b.branch_name };
    const byMethod = (b.revenue_by_method as Record<string, number>) || {};
    // FIX: was pre-converting to EGP, making the piastres-expecting ChartTooltip show values 100× too small
    for (const m of activeMethods) {
      base[m.name] = byMethod[m.name] ?? 0;
    }
    return base;
  }) ?? [];

  const handleExport = () => {
    if (!report) return;
    exportToExcel({
      filename: "Branch-Comparison",
      sheets: [{
        name: "Branches",
        title: t("analytics.revenueByBranch"),
        columns: [
          { key: "name", header: t("common.name"), accessor: (b: BranchComparison) => b.branch_name, width: 24 },
          { key: "orders", header: t("dashboard.orders"), accessor: (b: BranchComparison) => b.total_orders, type: "integer", width: 12, total: true },
          { key: "voided", header: t("orderStatus.voided"), accessor: (b: BranchComparison) => b.voided_orders, type: "integer", width: 12, total: true },
          { key: "aov", header: t("analytics.aov"), accessor: (b: BranchComparison) => b.avg_order_value, type: "money", width: 14 },
          ...activeMethods.map((m) => ({
            key: m.name,
            header: getLabel(m.name),
            accessor: (b: BranchComparison) => (b.revenue_by_method as Record<string, number>)?.[m.name] ?? 0,
            type: "money" as const,
            width: 14,
            total: true,
          })),
          { key: "rev", header: t("orders.totalRevenue"), accessor: (b: BranchComparison) => b.total_revenue, type: "money", width: 16, total: true },
        ],
        rows: report.branches,
        totals: true,
      }],
    });
  };

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!report || report.branches.length === 0) return <EmptyState icon={BarChart2} title={t("analytics.noData")} />;

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByBranch")} onExport={handleExport}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="name" fontSize={10} reversed={i18n.dir() === "rtl"} />
            <YAxis fontSize={10} tickFormatter={(v) => fmtMoneyCompact(v)} orientation={i18n.dir() === "rtl" ? "right" : "left"} />
            <ReTooltip content={<ChartTooltip valueFormat="money" />} />
            <Legend />
            {activeMethods.map((m) => (
              <Bar
                key={m.name}
                dataKey={m.name}
                stackId="a"
                name={getLabel(m.name)}
                fill={colorMap[m.name] || "#ccc"}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <DataTable columns={cols} data={report.branches} onExport={handleExport} searchKey="branch_name" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory Tab — stock bars
// ─────────────────────────────────────────────────────────────────────────────
