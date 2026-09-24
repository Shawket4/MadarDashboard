import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { Coins, ListChecks, Tag, UserRound } from "lucide-react";

import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { AuditReport, DiscountAuditEntry } from "@/data/api/generated/models";
import { bpsLabel, discountKindLabel } from "@/features/discounts/discount-attribution";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import { exportToExcel, exportToCsv, type ExcelColumn } from "@/lib/excel";
import { fmtDateTime, fmtMoney, fmtNumber } from "@/lib/format";

interface AuditRow {
  label: string;
  count: number;
  amount_minor: number;
}

interface AuditTabProps {
  query: { data?: AuditReport; isLoading: boolean; isError: boolean; refetch: () => void };
  /** The 2nd breakdown card's title (`by_reason`) — "Reason", "Void reason",
   * "Discount", "Branch"… whatever the report's second axis actually is. */
  reasonLabel: string;
  /** Sheet/filename title for the Excel export — the report's own name. */
  exportTitle: string;
  /** What `amount_minor` measures: money (default), loyalty points/visits
   *  (loyalty adjustments), or nothing (attendance corrections). */
  amount?: "money" | "points" | "none";
}

/** Codes for labels the server wrote itself (AT-13, E2E L-34) → their wording here. */
const REASON_CODE_KEYS: Record<string, [string, string]> = {
  unspecified: ["reports.legal.reason.unspecified", "Not given"],
  correction_request: ["reports.legal.reason.correction_request", "Approved correction request"],
  auto_closed: ["reports.legal.reason.auto_closed", "Closed automatically: no check-out"],
  marked_absent: ["reports.legal.reason.marked_absent", "Marked absent automatically: no check-in"],
};

/** A breakdown row's label in the reader's language: a server code is worded here; a person's own words stay as typed. */
export function auditReasonText(t: TFunction | ((k: string, o?: Record<string, unknown>) => string), r: { label: string; code?: string | null }): string {
  const tt = t as (k: string, o?: Record<string, unknown>) => string;
  if (!r.code) return r.label;
  const known = REASON_CODE_KEYS[r.code];
  if (known) return tt(known[0], { defaultValue: known[1] });
  const voidKey = `orders.voidReasons.${r.code}`;
  const v = tt(voidKey, { defaultValue: "" });
  if (v) return v;
  if (["preset", "manual_amount", "manual_percent"].includes(r.code)) return discountKindLabel(t as TFunction, r.code);
  return r.label;
}

export function auditCols(t: TFunction | ((k: string, o?: Record<string, unknown>) => string), amount: "money" | "points" | "none"): ExcelColumn<AuditRow>[] {
  const tt = t as (k: string, o?: Record<string, unknown>) => string;
  const cols: ExcelColumn<AuditRow>[] = [
    { header: tt("reports.legal.colLabel", { defaultValue: "Label" }), accessor: (r) => r.label, type: "text", width: 28 },
    { header: tt("reports.legal.eventCount", { defaultValue: "Events" }), accessor: (r) => r.count, type: "integer", width: 12, total: true },
  ];
  if (amount !== "none") {
    cols.push({
      header: amount === "points" ? tt("reports.legal.eventPoints", { defaultValue: "Points moved" }) : tt("reports.legal.colAmount", { defaultValue: "Amount" }),
      accessor: (r) => r.amount_minor, type: amount === "points" ? "integer" : "money", width: 16, total: true,
    });
  }
  return cols;
}

/** Every legal/compliance audit report shares this shape (a total plus a
 * reason and an issuer breakdown), so one component renders all nine. */
export function AuditTab({ query, reasonLabel, exportTitle, amount = "money" }: AuditTabProps) {
  const { t } = useTranslation();
  const d = query.data;
  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

  const amountLabel = amount === "points" ? t("reports.legal.eventPoints", "Points moved") : t("reports.legal.eventAmount", "Total amount");
  const kpis: LedgerItem[] = [
    { key: "count", label: t("reports.legal.eventCount", "Events"), icon: ListChecks, accent: "primary", value: d?.total_count ?? 0, formatType: "number", loading: query.isLoading },
    ...(amount === "none" ? [] : [{ key: "amount", label: amountLabel, icon: Coins, accent: "warning", value: d?.total_amount_minor ?? 0, formatType: amount === "points" ? "number" : "money", loading: query.isLoading } as LedgerItem]),
  ];
  const cols = auditCols(t, amount);
  const byReason = (d?.by_reason ?? []).map((r) => ({ ...r, label: auditReasonText(t, r) }));

  const buildSheets = () => [
    {
      name: reasonLabel.slice(0, 31),
      title: exportTitle,
      subtitle: reasonLabel,
      rows: byReason as unknown as Record<string, unknown>[],
      columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
      stats: [
        { label: t("reports.legal.eventCount", "Events"), value: d?.total_count ?? 0, type: "number" as const },
        ...(amount === "none" ? [] : [{ label: amountLabel, value: d?.total_amount_minor ?? 0, type: (amount === "points" ? "number" : "money") as "number" | "money" }]),
      ],
    },
    {
      name: t("reports.legal.byIssuer", "By staff member").slice(0, 31),
      title: exportTitle,
      subtitle: t("reports.legal.byIssuer", "By staff member"),
      rows: (d?.by_issuer ?? []) as unknown as Record<string, unknown>[],
      columns: cols as unknown as ExcelColumn<Record<string, unknown>>[],
    },
  ];

  const handleExport = async () => {
    if (!d) return;
    setExporting(true);
    try {
      await exportToExcel({ filename: `Madar-${exportTitle}`, logoUrl, sheets: buildSheets() });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!d) return;
    try {
      await exportToCsv({ filename: `Madar-${exportTitle}`, sheets: buildSheets() });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ExportButton onExport={handleExport} onExportCsv={handleExportCsv} loading={exporting} disabled={!d || d.total_count === 0} size="sm" />
      </div>
      <LedgerStrip items={kpis} />

      {query.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : !d || d.total_count === 0 ? (
        <EmptyState title={t("reports.legal.empty", "Nothing recorded in this period")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <BreakdownCard icon={ListChecks} title={reasonLabel} rows={byReason} amount={amount} />
          <BreakdownCard icon={UserRound} title={t("reports.legal.byIssuer", "By staff member")} rows={d.by_issuer} amount={amount} />
          {d.by_kind ? (
            <BreakdownCard
              icon={Tag}
              title={t("reports.legal.byKind", "By kind")}
              rows={d.by_kind.map((r) => ({ ...r, label: discountKindLabel(t, r.label) }))}
              amount={amount}
            />
          ) : null}
          {d.entries && d.entries.length > 0 ? <DiscountEntriesCard entries={d.entries} /> : null}
        </div>
      )}
    </div>
  );
}

function BreakdownCard({
  icon: Icon,
  title,
  rows,
  amount,
}: {
  icon: typeof ListChecks;
  title: string;
  rows: { label: string; count: number; amount_minor: number }[];
  amount: "money" | "points" | "none";
}) {
  const { t } = useTranslation();
  return (
    <Card className="py-0">
      <CardHeader className="pt-4">
        <CardTitle className="flex items-center gap-1.5 text-base">
          <Icon aria-hidden className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("reports.legal.empty", "Nothing recorded in this period")}</p>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{t("reports.legal.eventsCount", { defaultValue: "{{n}} events", n: fmtNumber(r.count) })}</p>
                </div>
                {amount === "none" ? null : (
                  <span className="shrink-0 font-mono tabular-nums">
                    {amount === "points" ? fmtNumber(r.amount_minor) : fmtMoney(r.amount_minor)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** The discounts audit's per-sale list: what kind, how much, who applied it,
 * who approved it, and whether the server flagged it. */
function DiscountEntriesCard({ entries }: { entries: DiscountAuditEntry[] }) {
  const { t } = useTranslation();
  return (
    <Card className="py-0 lg:col-span-2">
      <CardHeader className="pt-4">
        <CardTitle className="flex items-center gap-1.5 text-base">
          <ListChecks aria-hidden className="size-4 text-muted-foreground" />
          {t("reports.legal.discountSales", "Discounted sales")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ul className="divide-y text-sm">
          {entries.map((e) => (
            <li key={e.order_id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  <span className="truncate">{e.order_ref ?? e.order_id.slice(0, 8)}</span>
                  <span className="text-muted-foreground">{discountKindLabel(t, e.kind)}</span>
                  {e.preset_name ? <span>{e.preset_name}</span> : null}
                  {bpsLabel(e.percent_bps) ? <span className="font-mono tabular-nums">{bpsLabel(e.percent_bps)}</span> : null}
                  {e.flagged ? <Badge variant="destructive">{t("reports.legal.flagged", "Flagged")}</Badge> : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[
                    e.branch_name,
                    fmtDateTime(e.created_at),
                    e.applied_by_name ? t("discounts.appliedBy", { defaultValue: "by {{name}}", name: e.applied_by_name }) : null,
                    e.approved_by_name ? t("discounts.approvedBy", { defaultValue: "approved by {{name}}", name: e.approved_by_name }) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <span className="shrink-0 font-mono tabular-nums">{fmtMoney(e.amount_minor)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
