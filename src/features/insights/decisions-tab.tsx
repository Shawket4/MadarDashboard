import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowRight, Check, ClipboardList } from "lucide-react";

import { useListDecisions, useListUsers } from "@/data/api/generated/api";
import type { DecisionOut } from "@/data/api/generated/models";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { fmtDateTime, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SIGNAL_TONE, signalLabel } from "./signals";

/** Read a numeric field out of the baseline/impact JSON aggregates. */
const num = (o: unknown, key: string): number | null => {
  if (!o || typeof o !== "object") return null;
  const v = (o as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
};

const COLS = 7;

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

  if (decisions.isError) {
    return <EmptyState icon={AlertCircle} title={t("common.somethingWrong", "Something went wrong")} />;
  }

  const rows = decisions.data ?? [];

  if (!decisions.isLoading && rows.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={t("insights.decisions.empty", "No decisions yet")}
        description={t(
          "insights.decisions.emptyHint",
          "Fix, dismiss or snooze a flag on the ledger and its measured impact shows up here.",
        )}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("insights.columns.item", "Item")}</TableHead>
            <TableHead>{t("insights.columns.signal", "Signal")}</TableHead>
            <TableHead>{t("insights.columns.action", "Action")}</TableHead>
            <TableHead>{t("insights.columns.when", "When")}</TableHead>
            <TableHead className="text-end">{t("insights.decisions.qtyPerDay", "Qty/day")}</TableHead>
            <TableHead className="text-end">{t("insights.columns.marginPct", "Margin %")}</TableHead>
            <TableHead className="w-8" aria-label={t("insights.decisions.status", "Status")} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {decisions.isLoading
            ? Array.from({ length: 5 }).map((_, ri) => (
                <TableRow key={`sk-${ri}`}>
                  {Array.from({ length: COLS }).map((_, ci) => (
                    <TableCell key={ci}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((d) => <DecisionRow key={d.id} decision={d} who={nameOf(d.created_by)} actionLabel={actionLabel} />)}
        </TableBody>
      </Table>
    </div>
  );
}

function DecisionRow({
  decision: d,
  who,
  actionLabel,
}: {
  decision: DecisionOut;
  who: string | null;
  actionLabel: (action: string) => string;
}) {
  const { t } = useTranslation();
  const measuring = d.impact == null;

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{d.item_name}</span>
          {d.size_label !== "one_size" ? (
            <Badge variant="outline" className="shrink-0">{d.size_label}</Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
            SIGNAL_TONE[d.signal_kind] ?? "bg-muted text-muted-foreground",
          )}
        >
          {signalLabel(t, d.signal_kind)}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{actionLabel(d.action)}</TableCell>
      <TableCell>
        <div className="space-y-0.5">
          <p className="whitespace-nowrap text-sm">{fmtDateTime(d.created_at)}</p>
          {who ? <p className="truncate text-xs text-muted-foreground">{who}</p> : null}
        </div>
      </TableCell>
      {measuring ? (
        <TableCell colSpan={2} className="text-end text-muted-foreground">
          {t("insights.decisions.measuring", "Measuring…")}
        </TableCell>
      ) : (
        <>
          <TableCell className="text-end">
            <BeforeAfter
              before={num(d.baseline, "qty_per_day")}
              after={num(d.impact, "qty_per_day")}
              format={(v) => fmtNumber(v, { maximumFractionDigits: 2 })}
            />
          </TableCell>
          <TableCell className="text-end">
            <BeforeAfter
              before={num(d.baseline, "margin_pct")}
              after={num(d.impact, "margin_pct")}
              format={(v) => `${fmtNumber(v, { maximumFractionDigits: 1 })}%`}
            />
          </TableCell>
        </>
      )}
      <TableCell>
        {d.impact_complete ? (
          <Check aria-label={t("insights.decisions.complete", "Measurement complete")} className="size-3.5 text-success" />
        ) : null}
      </TableCell>
    </TableRow>
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
        ? "text-success"
        : "text-destructive";
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap tabular">
      <span className="text-muted-foreground">{show(before)}</span>
      <ArrowRight aria-hidden className="size-3 shrink-0 text-muted-foreground rtl:rotate-180" />
      <span className={cn("font-medium", tone)}>{show(after)}</span>
    </span>
  );
}
