import { useMemo, useState } from "react";
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
import { Restricted } from "@/components/app/restricted";
import { exportToCsv, exportToExcel, type ExcelColumn } from "@/lib/excel";
import { getErrorMessage } from "@/data/api/errors";
import { SalesTab } from "./sales-tab";
import { TimingTab } from "./timing-tab";
import { Badge } from "@/components/ui/badge";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useScope } from "@/data/scope/use-scope";
import { useBranchTillSessions } from "@/data/api/generated/api";
import type { TillSessionRow } from "@/data/api/generated/models";
import { fmtDateTime, fmtMoney, fmtMoneySigned, fmtNumber } from "@/lib/format";
import { fmtBusinessDate, isForceClosed, isOpen, isRangeRefused } from "./lib";

/** Stable identity for "no rows yet", so the memos below do not churn per render. */
const NO_ROWS: TillSessionRow[] = [];

type TabKey = "sessions" | "sales" | "timing";

/**
 * One row per till session — the drawer reconciliation a manager reads at the
 * end of a day: what the float was, what cash went through, what the teller
 * counted, and where it disagrees with the system.
 *
 * The columns add up on purpose: opening + net cash + pay-ins − pay-outs −
 * drops + adjustments is the expected figure, so a variance is always traceable to a line
 * above it rather than to arithmetic nobody can see.
 */
export function TillSessionsPage() {
  const { t } = useTranslation();
  const { scopeBranchId, from, to } = useScope();

  // The route answers anyone with till.read, but only holders of
  // till.read.branch get every session at a branch — everyone else is narrowed
  // to their own drawer. This page is the branch's reconciliation, so it is
  // offered to the people who get the whole of it; a partial list under this
  // title would read as the branch's tills and be wrong. "All branches" is the
  // branches the person works at, resolved server-side.
  const authz = useAuthz();
  const canSee = authz.can(Cap.tillReadBranch);
  const q = useBranchTillSessions(
    scopeBranchId,
    { from: from ?? undefined, to: to ?? undefined },
    { query: { enabled: canSee && !!from && !!to } },
  );
  const rows = q.data ?? NO_ROWS;
  // A refused range (400: over 5000 sessions) is the person's to fix, by
  // shortening the period — say that, and do not offer a Retry that cannot work.
  const refused = isRangeRefused(q.error);
  const loadError: unknown = refused
    ? t("reports.tills.rangeRefused", "Too many till sessions to list for this period. Choose a shorter date range.")
    : q.error;
  const onRetry = refused ? undefined : () => void q.refetch();
  const [tab, setTab] = useState<TabKey>("sessions");
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();

  const statusLabel = (r: TillSessionRow): string =>
    isOpen(r)
      ? t("reports.tills.stillOpen", "Open")
      : isForceClosed(r)
        ? t("reports.tills.forceClosed", "Force-closed")
        : t("reports.tills.statusClosed", "Closed");

  /** One row per till session, the same figures the table shows. */
  const runExport = async (kind: "excel" | "csv") => {
    setExporting(true);
    try {
      const cols: ExcelColumn<TillSessionRow>[] = [
        { header: t("reports.tills.businessDate", "Business date"), accessor: (r) => r.business_date, type: "text" },
        { header: t("reports.tills.branch", "Branch"), accessor: (r) => r.branch_name, type: "text" },
        { header: t("reports.tills.branchRef", "Branch ref."), accessor: (r) => r.branch_code, type: "text" },
        { header: t("reports.tills.user", "User"), accessor: (r) => r.teller_name, type: "text" },
        { header: t("reports.tills.openedAt", "Opened at"), accessor: (r) => r.opened_at, type: "dateTime" },
        { header: t("reports.tills.openingAmount", "Opening"), accessor: (r) => r.opening_cash, type: "money" },
        { header: t("reports.tills.netCash", "Net cash"), accessor: (r) => r.net_cash_payment, type: "money" },
        { header: t("reports.tills.payIns", "Pay-ins"), accessor: (r) => r.pay_ins, type: "money" },
        { header: t("reports.tills.payOuts", "Pay-outs"), accessor: (r) => r.pay_outs, type: "money" },
        { header: t("reports.tills.cashDrops", "Cash drops"), accessor: (r) => r.cash_drops, type: "money" },
        { header: t("reports.tills.adjustments", "Adjustments"), accessor: (r) => r.cash_adjustments, type: "money" },
        { header: t("reports.tills.closingAmount", "Declared"), accessor: (r) => r.closing_cash_declared, type: "money" },
        { header: t("reports.tills.expectedAmount", "Expected"), accessor: (r) => r.closing_cash_system, type: "money" },
        { header: t("reports.tills.variance", "Variance"), accessor: (r) => r.cash_discrepancy, type: "money" },
        { header: t("reports.tills.orders", "Orders"), accessor: (r) => r.orders_count, type: "integer" },
        { header: t("reports.tills.sales", "Net sales"), accessor: (r) => r.net_sales, type: "money" },
        { header: t("reports.tills.closedAt", "Closed at"), accessor: (r) => r.closed_at, type: "dateTime" },
        { header: t("reports.tills.status", "Status"), accessor: statusLabel, type: "text" },
      ];
      const title = t("reports.tills.title", "Till sessions");
      const sheets = [{
        name: title,
        title,
        rows: rows as unknown as Record<string, unknown>[],
        columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
      }];
      if (kind === "excel") await exportToExcel({ filename: `Madar-${title}`, logoUrl, sheets });
      else await exportToCsv({ filename: `Madar-${title}`, sheets });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  // Every column declares `meta.label`: it is what the column-visibility menu
  // lists and what the phone card uses as its field name. Without it a column
  // is silently unhideable and the card falls back to the raw accessor key.
  const columns = useMemo<ColumnDef<TillSessionRow>[]>(() => {
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
      adjustments: t("reports.tills.adjustments", "Adjustments"),
      closing: t("reports.tills.closingAmount", "Declared"),
      expected: t("reports.tills.expectedAmount", "Expected"),
      variance: t("reports.tills.variance", "Variance"),
      orders: t("reports.tills.orders", "Orders"),
      sales: t("reports.tills.sales", "Net sales"),
      closedAt: t("reports.tills.closedAt", "Closed at"),
    };
    const moneyCol = (
      key: "opening_cash" | "net_cash_payment" | "pay_ins" | "pay_outs" | "cash_drops"
        | "closing_cash_declared" | "closing_cash_system" | "net_sales",
      label: string,
    ): ColumnDef<TillSessionRow> => ({
      id: key,
      // `null` is "not known yet" (an open till has no close). Handed to the
      // sorter as undefined so those rows sink to the bottom either way,
      // instead of sorting as a zero between the shorts and the overs.
      accessorFn: (r) => r[key] ?? undefined,
      sortUndefined: "last",
      header: label,
      meta: { label, numeric: true } satisfies DataTableColumnMeta,
      cell: ({ row }) => fmtMoney(row.original[key]),
    });

    return [
      {
        accessorKey: "business_date",
        header: L.businessDate,
        meta: { label: L.businessDate } satisfies DataTableColumnMeta,
        cell: ({ row }) => <span className="whitespace-nowrap">{fmtBusinessDate(row.original.business_date)}</span>,
      },
      { accessorKey: "branch_name", header: L.branch, meta: { label: L.branch } satisfies DataTableColumnMeta },
      {
        accessorKey: "branch_code",
        header: L.branchRef,
        meta: { label: L.branchRef } satisfies DataTableColumnMeta,
        cell: ({ row }) => row.original.branch_code || "—",
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
      {
        // Corrections that name no pay-in, pay-out or drop. Signed, and part of
        // the add-up: without this column Expected cannot be reached from the
        // lines before it.
        accessorKey: "cash_adjustments",
        header: L.adjustments,
        meta: { label: L.adjustments, numeric: true } satisfies DataTableColumnMeta,
        cell: ({ row }) => fmtMoneySigned(row.original.cash_adjustments),
      },
      moneyCol("closing_cash_declared", L.closing),
      moneyCol("closing_cash_system", L.expected),
      {
        id: "cash_discrepancy",
        accessorFn: (r) => r.cash_discrepancy ?? undefined,
        sortUndefined: "last",
        header: L.variance,
        meta: { label: L.variance, numeric: true } satisfies DataTableColumnMeta,
        cell: ({ row }) => {
          const v = row.original.cash_discrepancy;
          if (v == null) return "—";
          if (v === 0) return fmtMoneySigned(v);
          // Short and over are different problems; neither is "bad red text".
          // The sign says which, and so does a word for a screen reader — the
          // tint is never the only carrier. It is pulled halfway to the
          // foreground because the raw tokens are too light to read at this
          // size, and mixed in OKLAB: see CLAUDE.md, "Mix in oklab".
          return (
            <span
              className="font-medium"
              style={{
                color: `color-mix(in oklab, var(--color-${v < 0 ? "destructive" : "warning"}) 50%, var(--color-foreground))`,
              }}
            >
              <span className="sr-only">{v < 0 ? t("tills.short", "Short") : t("tills.over", "Over")} </span>
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
      moneyCol("net_sales", L.sales),
      {
        id: "closed_at",
        accessorFn: (r) => r.closed_at ?? undefined,
        sortUndefined: "last",
        header: L.closedAt,
        meta: { label: L.closedAt } satisfies DataTableColumnMeta,
        cell: ({ row }) => {
          const r = row.original;
          if (isOpen(r) || !r.closed_at) {
            return <Badge variant="outline">{t("reports.tills.stillOpen", "Open")}</Badge>;
          }
          return (
            <span className="inline-flex items-center gap-2 whitespace-nowrap">
              {fmtDateTime(r.closed_at)}
              {/* No teller count behind this close, which is why Declared and
                  Variance are blank — say so rather than leave a silent dash. */}
              {isForceClosed(r) ? (
                <Badge variant="outline">{t("reports.tills.forceClosed", "Force-closed")}</Badge>
              ) : null}
            </span>
          );
        },
      },
    ];
  }, [t]);

  if (authz.ready && !canSee) {
    return (
      <Restricted
        title={t("reports.tills.title", "Till sessions")}
        who={t("reports.noAccess", "Your account can't open this report. The owner can give you access.")}
      />
    );
  }

  return (
    <Page>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-6">
        <PageHeader
          title={t("reports.tills.title", "Till sessions")}
          subtitle={
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange aria-hidden className="size-3.5" />
              {/* No count until there is one: "0 till sessions" while loading is a false report. */}
              {q.data
                ? t("reports.tills.subtitle", {
                    count: rows.length,
                    defaultValue: "{{count}} till sessions — opening float, cash through the drawer, and the close",
                  })
                : t("reports.tills.subtitleIdle", "Opening float, cash through the drawer, and the close")}
            </span>
          }
          actions={
            <ExportButton
              size="sm"
              onExport={() => runExport("excel")}
              onExportCsv={() => runExport("csv")}
              loading={exporting}
              disabled={rows.length === 0}
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
            error={loadError}
            onRetry={onRetry}
            getRowId={(r) => r.till_id}
            pageSize={50}
            searchPlaceholder={t("reports.tills.search", "Search branch or user")}
            emptyState={
              <EmptyState title={t("reports.tills.empty", "No till sessions opened in this period")} />
            }
          />
        </TabsContent>

        <TabsContent value="sales">
          <SalesTab rows={rows} loading={q.isLoading} error={loadError} onRetry={onRetry} />
        </TabsContent>

        <TabsContent value="timing">
          <TimingTab rows={rows} loading={q.isLoading} error={loadError} onRetry={onRetry} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}
