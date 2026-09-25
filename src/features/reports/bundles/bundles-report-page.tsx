/**
 * Reports › Bundles (C6): each combo and each deal as its own line — how many
 * sold, in how many orders, what they took, what the same items would have
 * rung at separately, the saving that gave away, the cost and the margin.
 *
 * Item sales already include the combo parts at their share (the split in
 * C6), so this is the one report that reads a combo as a combo. Revenue is
 * before the order discount, the same basis as item sales; voids are out and
 * refunds are netted by the server.
 */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Layers } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Restricted } from "@/components/app/restricted";
import { SegmentedControl } from "@/components/app/segmented-control";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { useScope } from "@/data/scope/use-scope";
import { useExportLogo } from "@/hooks/use-export-logo";
import { exportToExcel, type ExcelColumn } from "@/lib/excel";
import { cairoParts, fmtDate, fmtMoney, fmtNumber } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";
import { useBundlesReport } from "@/features/combos/api";
import type { BundleKind, BundlesReportRow } from "@/features/combos/types";
import { fmtRate, rateOf } from "@/features/combos/util";

import { Cap } from "@/generated/capabilities";

import { MixDialog } from "./mix-dialog";

/** ISO instant → the branch-local "YYYY-MM-DD" the report's date params take. */
function localDate(iso: string): string {
  const { y, m, d } = cairoParts(iso);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function BundlesReportPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const authz = useAuthz();
  const canSee = authz.can(Cap.reportsBundles);
  const { branchId, from, to } = useScope();
  const [kind, setKind] = useState<BundleKind>("combo");
  const [mixFor, setMixFor] = useState<BundlesReportRow | null>(null);
  const [exporting, setExporting] = useState(false);
  const logoUrl = useExportLogo();

  const params = useMemo(
    () => ({ from: localDate(from), to: localDate(to), branch_id: branchId ?? undefined, kind }),
    [from, to, branchId, kind],
  );
  const q = useBundlesReport(params, { enabled: canSee });
  const rows = useMemo(() => q.data?.rows ?? [], [q.data]);
  const totals = q.data?.totals;
  const name = (r: BundlesReportRow) => getTranslatedName(r, lang);

  const columns = useMemo<ColumnDef<BundlesReportRow>[]>(
    () => [
      {
        id: "name",
        header: kind === "combo" ? t("reports.bundles.col.combo", "Combo") : t("reports.bundles.col.deal", "Deal"),
        meta: { phone: "title" },
        cell: ({ row }) => <span className="font-medium">{name(row.original)}</span>,
      },
      {
        id: "sold",
        header: kind === "combo" ? t("reports.bundles.col.sold", "Sold") : t("reports.bundles.col.applied", "Applied"),
        meta: { numeric: true, label: t("reports.bundles.col.sold", "Sold") },
        cell: ({ row }) => fmtNumber(row.original.sold),
      },
      {
        id: "orders",
        header: t("reports.bundles.col.orders", "Orders"),
        meta: { numeric: true, label: t("reports.bundles.col.orders", "Orders") },
        cell: ({ row }) => fmtNumber(row.original.orders),
      },
      {
        id: "revenue",
        header: t("reports.bundles.col.revenue", "Revenue"),
        meta: { numeric: true, label: t("reports.bundles.col.revenue", "Revenue") },
        cell: ({ row }) => <span className="font-semibold">{fmtMoney(row.original.revenue)}</span>,
      },
      {
        id: "list",
        header: t("reports.bundles.col.listValue", "Separately"),
        meta: { numeric: true, label: t("reports.bundles.col.listValue", "Separately") },
        cell: ({ row }) => fmtMoney(row.original.list_value),
      },
      {
        id: "saving",
        header: t("reports.bundles.col.saving", "Saving given"),
        meta: { numeric: true, label: t("reports.bundles.col.saving", "Saving given") },
        cell: ({ row }) => fmtMoney(row.original.saving),
      },
      {
        id: "cost",
        header: t("reports.bundles.col.cost", "Cost"),
        meta: { numeric: true, label: t("reports.bundles.col.cost", "Cost") },
        cell: ({ row }) => (
          <span>
            {row.original.cost_missing ? "≥ " : ""}
            {fmtMoney(row.original.cost)}
          </span>
        ),
      },
      {
        id: "margin",
        header: t("reports.bundles.col.margin", "Margin"),
        meta: { numeric: true, label: t("reports.bundles.col.margin", "Margin") },
        cell: ({ row }) => (row.original.cost_missing ? "—" : fmtRate(row.original.margin)),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, kind, lang],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      type R = BundlesReportRow;
      const cols: ExcelColumn<R>[] = [
        { header: kind === "combo" ? t("reports.bundles.col.combo", "Combo") : t("reports.bundles.col.deal", "Deal"), accessor: (r) => name(r), type: "text", width: 30 },
        { header: kind === "combo" ? t("reports.bundles.col.sold", "Sold") : t("reports.bundles.col.applied", "Applied"), accessor: (r) => r.sold, type: "integer", width: 10, total: true },
        { header: t("reports.bundles.col.orders", "Orders"), accessor: (r) => r.orders, type: "integer", width: 10, total: true },
        { header: t("reports.bundles.col.revenue", "Revenue"), accessor: (r) => r.revenue, type: "money", width: 16, total: true },
        { header: t("reports.bundles.col.listValue", "Separately"), accessor: (r) => r.list_value, type: "money", width: 16, total: true },
        { header: t("reports.bundles.col.saving", "Saving given"), accessor: (r) => r.saving, type: "money", width: 16, total: true },
        { header: t("reports.bundles.col.cost", "Cost"), accessor: (r) => r.cost, type: "money", width: 16, total: true },
        { header: t("reports.bundles.col.margin", "Margin"), accessor: (r) => (r.cost_missing ? null : rateOf(r.margin)), type: "percent", width: 10 },
      ];
      const title = t("reports.bundles.title", "Bundles");
      await exportToExcel({
        filename: `Madar-Bundles-${kind === "combo" ? "Combos" : "Deals"}-${params.from}_${params.to}`,
        logoUrl,
        sheets: [
          {
            name: kind === "combo" ? t("reports.bundles.combos", "Combos") : t("reports.bundles.deals", "Deals"),
            title,
            subtitle: t("reports.bundles.period", { defaultValue: "{{from}} to {{to}}", from: fmtDate(from), to: fmtDate(to) }),
            rows: rows as unknown as Record<string, unknown>[],
            columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
            totals: true,
          },
        ],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const title = t("reports.bundles.title", "Bundles");
  if (authz.ready && !canSee) {
    return <Restricted title={title} who={t("reports.noAccess", "Your account can't open this report. The owner can give you access.")} />;
  }

  const kpis: LedgerItem[] = [
    { key: "sold", label: kind === "combo" ? t("reports.bundles.col.sold", "Sold") : t("reports.bundles.col.applied", "Applied"), value: totals?.sold ?? 0, formatType: "number", loading: q.isLoading },
    { key: "revenue", label: t("reports.bundles.col.revenue", "Revenue"), value: totals?.revenue ?? 0, formatType: "money", accent: "primary", loading: q.isLoading },
    { key: "saving", label: t("reports.bundles.col.saving", "Saving given"), value: totals?.saving ?? 0, formatType: "money", loading: q.isLoading },
    {
      key: "margin",
      label: t("reports.bundles.col.margin", "Margin"),
      value: totals && totals.revenue > 0 ? fmtRate((totals.revenue - totals.cost) / totals.revenue) : "—",
      loading: q.isLoading,
    },
  ];

  return (
    <Page>
      <PageHeader
        title={title}
        description={t(
          "reports.bundles.subtitle",
          "Each combo and deal as one line. Item sales count the same sales under each item, at its share of the price.",
        )}
        actions={<ExportButton onExport={handleExport} loading={exporting} disabled={rows.length === 0} />}
        below={
          <SegmentedControl<BundleKind>
            value={kind}
            onChange={setKind}
            options={[
              { value: "combo", label: t("reports.bundles.combos", "Combos") },
              { value: "deal", label: t("reports.bundles.deals", "Deals") },
            ]}
          />
        }
      />
      <LedgerStrip items={kpis} />
      <DataTable
        columns={columns}
        data={rows}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => void q.refetch()}
        getRowId={(r) => `${r.kind}:${r.id}`}
        onRowClick={kind === "combo" ? (r) => setMixFor(r) : undefined}
        emptyState={
          <EmptyState
            icon={Layers}
            title={kind === "combo" ? t("reports.bundles.emptyCombos", "No combos sold in this period") : t("reports.bundles.emptyDeals", "No deals applied in this period")}
            description={t("reports.bundles.emptyHint", "Try a longer period or another branch.")}
          />
        }
      />
      {mixFor ? (
        <MixDialog
          comboId={mixFor.id}
          name={name(mixFor)}
          params={{ from: params.from, to: params.to, branch_id: params.branch_id }}
          onClose={() => setMixFor(null)}
        />
      ) : null}
    </Page>
  );
}
