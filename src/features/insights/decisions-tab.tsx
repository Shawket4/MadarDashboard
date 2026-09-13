import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, Check, ClipboardList } from "lucide-react";

import { useListDecisions, useListUsers } from "@/data/api/generated/api";
import type { DecisionOut } from "@/data/api/generated/models";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { StatusPill } from "@/components/app/status-pill";
import { Badge } from "@/components/ui/badge";
import { fmtDateTime, fmtNumber, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SIGNAL_TONE, signalLabel } from "./signals";
import { TINT } from "./util";

/** Read a numeric field out of the baseline/impact JSON aggregates. */
const num = (o: unknown, key: string): number | null => {
  if (!o || typeof o !== "object") return null;
  const v = (o as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};

/**
 * The decision log: every dismiss/snooze/fix with its 28-day baseline and the
 * measured after-window — "did the call pay off?" in one row per decision.
 */
export function DecisionsTab({ orgId, branchId }: { orgId: string; branchId: string | null }) {
  const { t } = useTranslation();

  const decisions = useListDecisions(
    { org_id: orgId, ...(branchId ? { branch_id: branchId } : {}) },
    { query: { enabled: !!orgId } },
  );
  // Resolve created_by (a user id) to a display name.
  const users = useListUsers({ org_id: orgId }, { query: { enabled: !!orgId } });
  const nameOf = (id: string | null | undefined): string | null =>
    id ? (users.data?.find((u) => u.id === id)?.name ?? null) : null;

  const actionLabel = (action: string): string => {
    switch (action) {
      case "acted":
        return t("insights.actions.acted", "Fixed");
      case "dismissed":
        return t("insights.actions.dismissed", "Dismissed");
      case "snoozed":
        return t("insights.actions.snoozed", "Snoozed");
      default:
        return action;
    }
  };

  const rows = decisions.data ?? [];

  const columns: ColumnDef<DecisionOut>[] = [
    {
      id: "item",
      header: t("insights.columns.item", "Item"),
      meta: { label: t("insights.columns.item", "Item"), phone: "title" },
      cell: ({ row: { original: d } }) => (
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{d.item_name}</span>
          {d.size_label !== "one_size" ? <Badge variant="outline" className="shrink-0">{d.size_label}</Badge> : null}
        </div>
      ),
    },
    {
      id: "signal",
      header: t("insights.columns.signal", "Signal"),
      meta: { label: t("insights.columns.signal", "Signal") },
      cell: ({ row: { original: d } }) => (
        <StatusPill tone={SIGNAL_TONE[d.signal_kind] ?? "neutral"} size="sm">
          {signalLabel(t, d.signal_kind)}
        </StatusPill>
      ),
    },
    {
      id: "action",
      header: t("insights.columns.action", "Action"),
      meta: { label: t("insights.columns.action", "Action") },
      cell: ({ row }) => <span className="text-muted-foreground">{actionLabel(row.original.action)}</span>,
    },
    {
      id: "when",
      header: t("insights.columns.when", "When"),
      meta: { label: t("insights.columns.when", "When") },
      cell: ({ row: { original: d } }) => {
        const who = nameOf(d.created_by);
        return (
          <div className="space-y-0.5">
            <p className="whitespace-nowrap font-mono text-sm tabular">{fmtDateTime(d.created_at)}</p>
            {who ? <p className="truncate text-xs text-muted-foreground">{who}</p> : null}
          </div>
        );
      },
    },
    {
      id: "qty",
      header: t("insights.decisions.qtyPerDay", "Qty/day"),
      meta: { label: t("insights.decisions.qtyPerDay", "Qty/day"), numeric: true },
      cell: ({ row: { original: d } }) =>
        d.impact == null ? (
          <span className="text-muted-foreground">{t("insights.decisions.measuring", "Measuring…")}</span>
        ) : (
          <BeforeAfter
            before={num(d.baseline, "qty_per_day")}
            after={num(d.impact, "qty_per_day")}
            format={(v) => fmtNumber(v, { maximumFractionDigits: 2 })}
          />
        ),
    },
    {
      id: "margin",
      header: t("insights.columns.marginPct", "Margin %"),
      meta: { label: t("insights.columns.marginPct", "Margin %"), numeric: true },
      cell: ({ row: { original: d } }) =>
        d.impact == null ? null : (
          <BeforeAfter
            before={num(d.baseline, "margin_pct")}
            after={num(d.impact, "margin_pct")}
            format={(v) => fmtPercent(v / 100)}
          />
        ),
    },
    {
      id: "status",
      header: () => <span className="sr-only">{t("insights.decisions.status", "Status")}</span>,
      meta: { label: t("insights.decisions.status", "Status"), className: "w-8" },
      cell: ({ row: { original: d } }) =>
        d.impact_complete ? (
          <Check aria-label={t("insights.decisions.complete", "Measurement complete")} className={cn("size-3.5", TINT.success)} />
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      loading={decisions.isLoading}
      error={decisions.error}
      onRetry={() => void decisions.refetch()}
      getRowId={(d) => d.id}
      hideViewOptions
      emptyState={
        <EmptyState
          icon={ClipboardList}
          title={t("insights.decisions.empty", "No decisions yet")}
          description={t(
            "insights.decisions.emptyHint",
            "Fix, dismiss or snooze a flag on the ledger and its measured impact shows up here.",
          )}
        />
      }
    />
  );
}

/** `before → after` with the after value tinted by the delta direction. */
function BeforeAfter({
  before,
  after,
  format,
}: {
  before: number | null;
  after: number | null;
  format: (v: number) => string;
}) {
  const show = (v: number | null): string => (v == null ? "—" : format(v));
  const delta = before != null && after != null ? after - before : null;
  const tone =
    delta == null || delta === 0
      ? "text-muted-foreground"
      : delta > 0
        ? TINT.success
        : TINT.danger;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap font-mono tabular">
      <span className="text-muted-foreground">{show(before)}</span>
      <ArrowRight aria-hidden className="size-3 shrink-0 text-muted-foreground rtl:rotate-180" />
      <span className={cn("font-medium", tone)}>{show(after)}</span>
    </span>
  );
}
