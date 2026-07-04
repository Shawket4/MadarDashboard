import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Building2, Info } from "lucide-react";

import { Page } from "@/components/app/page";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { SegmentedControl } from "@/components/app/segmented-control";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useCreateDecision, useMenuMarginLedger } from "@/data/api/generated/api";
import type { MarginLedgerRow, Signal } from "@/data/api/generated/models";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DecisionsTab } from "./decisions-tab";
import { FlagChip } from "./flag-chip";
import { TargetEditor } from "./target-editor";
import { invalidateInsights } from "./util";

type CostBasis = "snapshot" | "current";

const COLS = 8;

/** Ratio for the trend pill, e.g. 0.12 → +12% vs the previous period. */
const trendOf = (cur: number | undefined, prev: number | undefined): number | null =>
  cur != null && prev != null && prev > 0 ? (cur - prev) / prev : null;

/**
 * Menu profitability — the margin ledger. Every SKU ranked by what it puts in
 * the till, measured against the org/branch margin target, with advisory flags
 * that carry their own fix/dismiss/snooze actions. The second tab is the
 * decision log with measured before/after impact.
 */
export function ProfitabilityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orgId = useOrgId();
  const { branchId, scopeBranchId, from, to } = useScope();

  const [basis, setBasis] = useState<CostBasis>("snapshot");
  const [tab, setTab] = useState("ledger");
  const [flaggedOnly, setFlaggedOnly] = useState(false);

  const ledger = useMenuMarginLedger(
    scopeBranchId,
    {
      from: from ?? undefined,
      to: to ?? undefined,
      ...(basis === "current" ? { cost_basis: "current" } : {}),
    },
    { query: { enabled: !!orgId } },
  );
  const createDecision = useCreateDecision();

  const report = ledger.data;
  const totals = report?.totals;
  const loading = ledger.isLoading;

  const decisionVars = (row: MarginLedgerRow, signal: Signal, action: "acted" | "dismissed" | "snoozed") => ({
    data: {
      branch_id: branchId,
      menu_item_id: row.menu_item_id,
      size_label: row.size_label,
      signal_kind: signal.kind,
      action,
      detail: {},
    },
    params: { org_id: orgId ?? "" },
  });

  /** Fix: record `acted` (fire-and-forget — powers impact measurement), then
   *  deep-link to the surface named by `signal.link`. */
  const fix = (row: MarginLedgerRow, signal: Signal) => {
    createDecision.mutate(decisionVars(row, signal, "acted"), {
      onSuccess: () => void invalidateInsights(),
    });
    if (signal.link === "pricing") {
      void navigate({ to: "/menu/pricing" });
    } else {
      void navigate({
        to: "/menu/items/$itemId",
        params: { itemId: row.menu_item_id },
        search: signal.link === "studio_recipe" ? { tab: "recipe" } : {},
      });
    }
  };

  /** Dismiss/snooze: suppression is server-side — invalidate and the signal
   *  drops out of the ledger. */
  const decide = async (row: MarginLedgerRow, signal: Signal, action: "dismissed" | "snoozed") => {
    try {
      await createDecision.mutateAsync(decisionVars(row, signal, action));
      await invalidateInsights();
    } catch {
      toast.error(t("common.somethingWrong", "Something went wrong"));
    }
  };

  if (!orgId) {
    return (
      <Page>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {t("insights.profitability.title", "Menu profitability")}
        </h1>
        <EmptyState icon={Building2} title={t("insights.pickOrg", "Select an organization to see menu profitability")} />
      </Page>
    );
  }

  const gap = totals?.below_target_gap ?? 0;
  const strip: LedgerItem[] = [
    {
      key: "revenue",
      label: t("insights.profitability.revenue", "Revenue"),
      value: totals?.revenue ?? 0,
      formatType: "money",
      accent: "brand",
      trend: trendOf(totals?.revenue, totals?.prev_revenue),
      loading,
    },
    {
      key: "margin",
      label: t("insights.profitability.grossMargin", "Gross margin"),
      value: totals?.margin_known ?? 0,
      formatType: "money",
      accent: "success",
      trend: trendOf(totals?.margin_known, totals?.prev_margin_known),
      hint:
        totals?.margin_pct != null
          ? t("insights.profitability.ofRevenue", {
              pct: fmtNumber(totals.margin_pct, { maximumFractionDigits: 1 }),
              defaultValue: "{{pct}}% of revenue",
            })
          : undefined,
      loading,
    },
    {
      key: "gap",
      label: t("insights.profitability.belowTargetGap", "Margin below target"),
      value: gap,
      formatType: "money",
      accent: gap > 0 ? "warning" : "neutral",
      loading,
    },
  ];

  const rows = (report?.rows ?? []).filter((r) => !flaggedOnly || r.flags.length > 0);

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {t("insights.profitability.title", "Menu profitability")}
          </h1>
          {loading ? (
            <Skeleton className="h-5 w-44" />
          ) : report ? (
            <TargetEditor
              orgId={orgId}
              branchId={branchId}
              targetPct={report.target_pct}
              targetSource={report.target_source}
            />
          ) : null}
        </div>
        <SegmentedControl<CostBasis>
          value={basis}
          onChange={setBasis}
          options={[
            { value: "snapshot", label: t("insights.profitability.basisSnapshot", "Snapshot") },
            { value: "current", label: t("insights.profitability.basisCurrent", "Today's costs") },
          ]}
        />
      </div>

      <div className="space-y-2">
        <LedgerStrip className="lg:max-w-3xl" items={strip} />
        {report && report.rows_cost_unknown > 0 ? (
          <p className="flex items-center gap-1.5 text-sm text-info">
            <Info aria-hidden className="size-4 shrink-0" />
            {t("insights.profitability.costUnknownNote", {
              count: report.rows_cost_unknown,
              defaultValue: "{{count}} items excluded from margin — cost unknown",
            })}
          </p>
        ) : null}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <PageTabsList>
          <PageTabsTrigger value="ledger">{t("insights.profitability.ledgerTab", "Ledger")}</PageTabsTrigger>
          <PageTabsTrigger value="decisions">{t("insights.profitability.decisionsTab", "Decisions")}</PageTabsTrigger>
        </PageTabsList>

        <TabsContent value="ledger" className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <Switch id="insights-flagged-only" checked={flaggedOnly} onCheckedChange={setFlaggedOnly} />
            <Label htmlFor="insights-flagged-only" className="text-sm font-normal text-muted-foreground">
              {t("insights.profitability.flaggedOnly", "Flagged only")}
            </Label>
          </div>

          {ledger.isError ? (
            <EmptyState icon={AlertCircle} title={t("common.somethingWrong", "Something went wrong")} />
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("insights.columns.item", "Item")}</TableHead>
                    <TableHead className="text-end">{t("insights.columns.sold", "Sold")}</TableHead>
                    <TableHead className="text-end">{t("insights.columns.revenue", "Revenue")}</TableHead>
                    <TableHead className="text-end">{t("insights.columns.cost", "Cost")}</TableHead>
                    <TableHead className="text-end">{t("insights.columns.margin", "Margin")}</TableHead>
                    <TableHead className="text-end">{t("insights.columns.marginPct", "Margin %")}</TableHead>
                    <TableHead className="text-end">{t("insights.columns.share", "Share %")}</TableHead>
                    <TableHead>{t("insights.columns.flags", "Flags")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, ri) => (
                      <TableRow key={`sk-${ri}`}>
                        {Array.from({ length: COLS }).map((_, ci) => (
                          <TableCell key={ci}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={COLS} className="py-8 text-center text-muted-foreground">
                        {flaggedOnly
                          ? t("insights.profitability.noFlags", "Nothing flagged — margins look healthy")
                          : t("insights.profitability.noRows", "No sales in this period")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <LedgerRow
                        key={`${r.menu_item_id}-${r.size_label}`}
                        row={r}
                        targetPct={report?.target_pct}
                        busy={createDecision.isPending}
                        onFix={fix}
                        onDecide={decide}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="decisions">
          <DecisionsTab orgId={orgId} branchId={branchId} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

function LedgerRow({
  row: r,
  targetPct,
  busy,
  onFix,
  onDecide,
}: {
  row: MarginLedgerRow;
  targetPct: number | undefined;
  busy: boolean;
  onFix: (row: MarginLedgerRow, signal: Signal) => void;
  onDecide: (row: MarginLedgerRow, signal: Signal, action: "dismissed" | "snoozed") => Promise<void>;
}) {
  const { t } = useTranslation();
  const qtyDelta = r.quantity_sold - r.prev_quantity;
  const belowTarget = r.margin_pct != null && targetPct != null && r.margin_pct < targetPct;

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2">
          <span className="max-w-56 truncate font-medium">{r.item_name}</span>
          {r.size_label !== "one_size" ? (
            <Badge variant="outline" className="shrink-0">{r.size_label}</Badge>
          ) : null}
          {!r.on_menu ? (
            <Badge variant="ghost" className="shrink-0 bg-muted text-muted-foreground">
              {t("insights.profitability.offMenu", "Off menu")}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-end tabular">
        <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
          {fmtNumber(r.quantity_sold)}
          {qtyDelta !== 0 ? (
            <span
              className={cn(
                "inline-flex items-center text-xs",
                qtyDelta > 0 ? "text-success" : "text-destructive",
              )}
              title={t("insights.profitability.vsPrev", "vs previous period")}
            >
              {qtyDelta > 0 ? (
                <ArrowUpRight aria-hidden className="size-3" />
              ) : (
                <ArrowDownRight aria-hidden className="size-3" />
              )}
              {fmtNumber(Math.abs(qtyDelta))}
            </span>
          ) : null}
        </span>
      </TableCell>
      <TableCell className="text-end tabular">{fmtMoney(r.revenue)}</TableCell>
      <TableCell className="text-end tabular">{fmtMoney(r.cost)}</TableCell>
      <TableCell className={cn("text-end tabular", r.margin != null && r.margin < 0 && "text-destructive")}>
        {fmtMoney(r.margin)}
      </TableCell>
      <TableCell className={cn("text-end tabular", belowTarget && "text-warning")}>
        {r.margin_pct == null ? "—" : fmtPercent(r.margin_pct / 100)}
      </TableCell>
      <TableCell className="text-end tabular text-muted-foreground">
        {r.margin_share_pct == null ? "—" : fmtPercent(r.margin_share_pct / 100)}
      </TableCell>
      <TableCell>
        {r.flags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {r.flags.map((s) => (
              <FlagChip
                key={s.kind}
                signal={s}
                busy={busy}
                onFix={(sig) => onFix(r, sig)}
                onDecide={(sig, action) => onDecide(r, sig, action)}
              />
            ))}
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
