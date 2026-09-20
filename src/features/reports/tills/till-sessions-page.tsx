import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { CalendarRange } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable, type DataTableColumnMeta } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { exportToCsv, type ExcelColumn } from "@/lib/excel";
import { getErrorMessage } from "@/data/api/errors";
import { SalesTab } from "./sales-tab";
import { TimingTab } from "./timing-tab";
import { Badge } from "@/components/ui/badge";
import { useScope } from "@/data/scope/use-scope";
import { useBranchTillSessions } from "@/data/api/generated/api";
import type { TillSessionRow } from "@/data/api/generated/models";
import { cn } from "@/lib/utils";
import { fmtDate, fmtDateTime, fmtMoney, fmtMoneySigned, fmtNumber } from "@/lib/format";

const ALL_BRANCHES = "00000000-0000-0000-0000-000000000000";

type TabKey = "sessions" | "sales" | "timing";

/**
 * One row per till session — the drawer reconciliation a manager reads at the
 * end of a day: what the float was, what cash went through, what the teller
 * counted, and where it disagrees with the system.
 *
 * The columns add up on purpose: opening + net cash + pay-ins − pay-outs −
 * drops is the expected figure, so a variance is always traceable to a line
 * above it rather than to arithmetic nobody can see.
 */
export function TillSessionsPage() {
  const { t } = useTranslation();
  const { branchId, from, to } = useScope();

  const q = useBranchTillSessions(
    branchId ?? ALL_BRANCHES,
    { from: from ?? undefined, to: to ?? undefined },
    { query: { enabled: !!from && !!to } },
  );
  const rows = q.data ?? [];
  const [tab, setTab] = useState<TabKey>("sessions");
  const [exporting, setExporting] = useState(false);

  /** One row per till session, the same figures the table shows. */
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const cols: ExcelColumn<TillSessionRow>[] = [
        { header: t("reports.tills.businessDate", "Business date"), accessor: (r) => r.business_date, type: "date" },
        { header: t("reports.tills.branch", "Branch"), accessor: (r) => r.branch_name, type: "text" },
        { header: t("reports.tills.branchRef", "Branch ref."), accessor: (r) => r.branch_code ?? "", type: "text" },
        { header: t("reports.tills.user", "User"), accessor: (r) => r.teller_name, type: "text" },
        { header: t("reports.tills.openedAt", "Opened at"), accessor: (r) => r.opened_at, type: "dateTime" },
        { header: t("reports.tills.openingAmount", "Opening"), accessor: (r) => r.opening_cash, type: "money" },
        { header: t("reports.tills.netCash", "Net cash"), accessor: (r) => r.net_cash_payment, type: "money" },
        { header: t("reports.tills.payIns", "Pay-ins"), accessor: (r) => r.pay_ins, type: "money" },
        { header: t("reports.tills.payOuts", "Pay-outs"), accessor: (r) => r.pay_outs, type: "money" },
        { header: t("reports.tills.cashDrops", "Cash drops"), accessor: (r) => r.cash_drops, type: "money" },
        { header: t("reports.tills.closingAmount", "Closing"), accessor: (r) => r.closing_cash_declared, type: "money" },
        { header: t("reports.tills.expectedAmount", "Expected"), accessor: (r) => r.closing_cash_system, type: "money" },
        { header: t("reports.tills.variance", "Variance"), accessor: (r) => r.cash_discrepancy, type: "money" },
        { header: t("reports.tills.orders", "Orders"), accessor: (r) => r.orders_count, type: "integer" },
        { header: t("reports.tills.sales", "Sales"), accessor: (r) => r.gross_sales, type: "money" },
        { header: t("reports.tills.closedAt", "Closed at"), accessor: (r) => r.closed_at, type: "dateTime" },
      ];
      const title = t("reports.tills.title", "Till sessions");
      await exportToCsv({
        filename: `Madar-${title}`,
        sheets: [{
          name: title,
          title,
          rows: rows as unknown as Record<string, unknown>[],
          columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
        }],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  // Every column declares `meta.label`: it is what the column-visibility menu
  // lists and what the phone card uses as its field name. Without it a column
  // is silently unhideable and the card falls back to the raw accessor key.
  const L = {
    businessDate: t("reports.tills.businessDate", "Business date"),
    branch: t("reports.tills.branch", "Branch"),
    branchRef: t("reports.tills.branchRef", "Branch ref."),
    user: t("reports.tills.user", "User"),
    openedAt: t("reports.tills.openedAt", "Opened at"),
    opening: t("reports.tills.openingAmount", "Opening"),
    netCash: t("reports.tills.netCash", "Net cash"),
    payIns: t("reports.tills.payIns", "Pay-ins"),
    payOuts: t("reports.tills.payOuts", "Pay-outs"),
    cashDrops: t("reports.tills.cashDrops", "Cash drops"),
    closing: t("reports.tills.closingAmount", "Closing"),
    expected: t("reports.tills.expectedAmount", "Expected"),
    variance: t("reports.tills.variance", "Variance"),
    orders: t("reports.tills.orders", "Orders"),
    sales: t("reports.tills.sales", "Sales"),
    closedAt: t("reports.tills.closedAt", "Closed at"),
  };
  const moneyCol = (
    key: "opening_cash" | "net_cash_payment" | "pay_ins" | "pay_outs" | "cash_drops"
      | "closing_cash_declared" | "closing_cash_system" | "gross_sales",
    label: string,
  ): ColumnDef<TillSessionRow> => ({
    accessorKey: key,
    header: label,
    meta: { label, numeric: true } satisfies DataTableColumnMeta,
    cell: ({ row }) => (row.original[key] == null ? "—" : fmtMoney(row.original[key])),
  });

  const columns: ColumnDef<TillSessionRow>[] = [
    {
      accessorKey: "business_date",
      header: L.businessDate,
      meta: { label: L.businessDate } satisfies DataTableColumnMeta,
      cell: ({ row }) => <span className="whitespace-nowrap">{fmtDate(row.original.business_date)}</span>,
    },
    { accessorKey: "branch_name", header: L.branch, meta: { label: L.branch } satisfies DataTableColumnMeta },
    {
      accessorKey: "branch_code",
      header: L.branchRef,
      meta: { label: L.branchRef } satisfies DataTableColumnMeta,
      cell: ({ row }) => row.original.branch_code ?? "—",
    },
    { accessorKey: "teller_name", header: L.user, meta: { label: L.user } satisfies DataTableColumnMeta },
    {
      accessorKey: "opened_at",
      header: L.openedAt,
      meta: { label: L.openedAt } satisfies DataTableColumnMeta,
      cell: ({ row }) => <span className="whitespace-nowrap">{fmtDateTime(row.original.opened_at)}</span>,
    },
    moneyCol("opening_cash", L.opening),
    moneyCol("net_cash_payment", L.netCash),
    moneyCol("pay_ins", L.payIns),
    moneyCol("pay_outs", L.payOuts),
    moneyCol("cash_drops", L.cashDrops),
    moneyCol("closing_cash_declared", L.closing),
    moneyCol("closing_cash_system", L.expected),
    {
      accessorKey: "cash_discrepancy",
      header: L.variance,
      meta: { label: L.variance, numeric: true } satisfies DataTableColumnMeta,
      cell: ({ row }) => {
        const v = row.original.cash_discrepancy;
        if (v == null) return "—";
        // Short and over are different problems; neither is "bad red text".
        // The tint is pulled halfway to the foreground because the raw tokens
        // are too light to read at this size. Mixed in OKLAB, not OKLCH:
        // oklch interpolates HUE, and `--color-foreground` is not hueless
        // (chroma .005 @ hue 205), so a red mixed in oklch swings to hue 117
        // and renders GREEN — a short till that looked like good news.
        return (
          <span
            className={cn(v !== 0 && "font-medium")}
            style={
              v === 0
                ? undefined
                : {
                    color: `color-mix(in oklab, var(--color-${v < 0 ? "destructive" : "warning"}) 50%, var(--color-foreground))`,
                  }
            }
          >
            {fmtMoneySigned(v)}
          </span>
        );
      },
    },
    {
      accessorKey: "orders_count",
      header: L.orders,
      meta: { label: L.orders, numeric: true } satisfies DataTableColumnMeta,
      cell: ({ row }) => fmtNumber(row.original.orders_count),
    },
    moneyCol("gross_sales", L.sales),
    {
      accessorKey: "closed_at",
      header: L.closedAt,
      meta: { label: L.closedAt } satisfies DataTableColumnMeta,
      cell: ({ row }) =>
        row.original.closed_at ? (
          <span className="whitespace-nowrap">{fmtDateTime(row.original.closed_at)}</span>
        ) : (
          <Badge variant="outline">{t("reports.tills.stillOpen", "Open")}</Badge>
        ),
    },
  ];

  return (
    <Page>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-6">
        <PageHeader
          title={t("reports.tills.title", "Till sessions")}
          subtitle={
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange aria-hidden className="size-3.5" />
              {t("reports.tills.subtitle", {
                count: rows.length,
                defaultValue: "{{count}} till sessions — opening float, cash through the drawer, and the close",
              })}
            </span>
          }
          actions={
            <ExportButton
              size="sm"
              onExport={handleExportCsv}
              loading={exporting}
              disabled={rows.length === 0}
              label={t("common.exportCsv", "Export CSV")}
            />
          }
          below={
            <PageTabsList>
              <PageTabsTrigger value="sessions" className="first:ps-0">
                {t("reports.tills.tabSessions", "Sessions")}
              </PageTabsTrigger>
              <PageTabsTrigger value="sales">{t("reports.tills.tabSales", "Sales")}</PageTabsTrigger>
              <PageTabsTrigger value="timing">{t("reports.tills.tabTiming", "Open & close")}</PageTabsTrigger>
            </PageTabsList>
          }
        />

        <TabsContent value="sessions">
          <DataTable
            columns={columns}
            data={rows}
            loading={q.isLoading}
            error={q.error}
            onRetry={() => void q.refetch()}
            getRowId={(r) => r.till_id}
            pageSize={50}
            searchPlaceholder={t("reports.tills.search", "Search branch or user")}
            emptyState={
              <EmptyState title={t("reports.tills.empty", "No till sessions opened in this period")} />
            }
          />
        </TabsContent>

        <TabsContent value="sales">
          <SalesTab rows={rows} loading={q.isLoading} />
        </TabsContent>

        <TabsContent value="timing">
          <TimingTab rows={rows} loading={q.isLoading} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
