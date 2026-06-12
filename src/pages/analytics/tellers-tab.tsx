import { useTranslation } from "react-i18next";
import { type ColumnDef } from "@tanstack/react-table";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as ReTooltip, XAxis, YAxis } from "recharts";
import { Users } from "lucide-react";
import { DataTable } from "@/shared/ui/data-table";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { ChartTooltip } from "@/shared/ui/chart-tooltip";
import { useBranchTellerStats as useBranchTellers } from "@/shared/api/generated/api";
import { fmtMoney, fmtMoneyCompact } from "@/shared/lib/format";
import { exportToExcel } from "@/shared/lib/excel";
import type { TellerStats } from "@/shared/types";
import { ChartCard } from "./chart-card";


const CHART_HEIGHT = 300;

export function TellersTab({ branchId, from, to }: { branchId: string; from: string | null; to: string | null }) {
  const { t, i18n } = useTranslation(); /* eslint-disable-next-line @typescript-eslint/no-unused-vars */ void i18n.language;
  const { data: tellers = [], isLoading } = useBranchTellers(branchId, { from: from ?? undefined, to: to ?? undefined }, { query: { enabled: !!branchId } });

  // FIX: was pre-converting to EGP, making the piastres-expecting ChartTooltip show values 100× too small
  const chartData = tellers.map((t2) => ({ name: t2.teller_name, revenue: t2.revenue, orders: t2.orders }));

  const cols: ColumnDef<TellerStats>[] = [
    { accessorKey: "teller_name", header: t("common.name"), cell: ({ row }) => <span className="font-semibold text-sm">{row.original.teller_name}</span> },
    { accessorKey: "orders", header: t("dashboard.orders") },
    { accessorKey: "voided", header: t("orderStatus.voided"), cell: ({ row }) => <span className={row.original.voided > 0 ? "text-destructive" : ""}>{row.original.voided}</span> },
    { accessorKey: "shifts", header: t("nav.shifts") },
    { accessorKey: "avg_order_value", header: t("analytics.aov"), cell: ({ row }) => <span className="tabular">{fmtMoney(row.original.avg_order_value)}</span> },
    { accessorKey: "revenue", header: t("orders.totalRevenue"), cell: ({ row }) => <span className="tabular font-semibold">{fmtMoney(row.original.revenue)}</span> },
  ];

  const handleExport = () =>
    exportToExcel({
      filename: "Tellers",
      sheets: [{
        name: "Tellers",
        title: t("analytics.revenueByTeller"),
        columns: [
          { key: "name", header: t("common.name"), accessor: (tl: TellerStats) => tl.teller_name, width: 24 },
          { key: "orders", header: t("dashboard.orders"), accessor: (tl: TellerStats) => tl.orders, type: "integer", width: 12, total: true },
          { key: "voided", header: t("orderStatus.voided"), accessor: (tl: TellerStats) => tl.voided, type: "integer", width: 12, total: true },
          { key: "shifts", header: t("nav.shifts"), accessor: (tl: TellerStats) => tl.shifts, type: "integer", width: 12, total: true },
          { key: "aov", header: t("analytics.aov"), accessor: (tl: TellerStats) => tl.avg_order_value, type: "money", width: 14 },
          { key: "revenue", header: t("orders.totalRevenue"), accessor: (tl: TellerStats) => tl.revenue, type: "money", width: 16, total: true },
        ],
        rows: tellers,
        totals: true,
      }],
    });

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (tellers.length === 0) return <EmptyState icon={Users} title={t("analytics.noData")} />;

  return (
    <div className="space-y-4">
      <ChartCard title={t("analytics.revenueByTeller")} onExport={handleExport}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis type="number" fontSize={10} tickFormatter={(v) => fmtMoneyCompact(v)} reversed={i18n.dir() === "rtl"} />
            <YAxis type="category" dataKey="name" fontSize={10} width={100} orientation={i18n.dir() === "rtl" ? "right" : "left"} />
            <ReTooltip content={<ChartTooltip valueFormat="money" />} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <DataTable columns={cols} data={tellers} searchKey="teller_name" onExport={handleExport} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Branches Tab — stacked bar keeps Talabat split to avoid double-counting
// ─────────────────────────────────────────────────────────────────────────────
