import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowDownRight, ArrowUpRight, Building2, Info } from "lucide-react";

import type { ColumnDef } from "@tanstack/react-table";

import { Page, PageHeader } from "@/components/app/page";
import { DataTable } from "@/components/app/data-table";
import { PageTabsList, PageTabsTrigger } from "@/components/app/page-tabs";
import { EmptyState } from "@/components/app/empty-state";
import { ExportButton } from "@/components/app/export-button";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import { SegmentedControl } from "@/components/app/segmented-control";
import { QuadrantView } from "./quadrant-view";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreateDecision, useMenuMarginLedger } from "@/data/api/generated/api";
import type { MarginLedgerRow, Signal } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useExportLogo } from "@/hooks/use-export-logo";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { exportToExcel, exportToCsv, type ExcelColumn } from "@/lib/excel";
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DecisionsTab } from "./decisions-tab";
import { RepricingTab } from "./repricing-tab";
import { FlagChip } from "./flag-chip";
import { TargetEditor } from "./target-editor";
import { invalidateInsights, TINT } from "./util";

type CostBasis = "snapshot" | "current";
/** How the ledger tab is read: row by row, or as the profit/popularity quadrant. */
type LedgerView = "table" | "quadrant";

/** The classic menu-engineering quadrants (secondary lens on the ledger). */
const ALL_CLASSES = "__all__";
const CLASS_META: Record<string, { fallback: string; className: string }> = {
  star: { fallback: "Star", className: "bg-secondary text-foreground" },
  workhorse: { fallback: "Workhorse", className: "bg-secondary text-foreground" },
  challenge: { fallback: "Challenge", className: "bg-secondary text-foreground" },
  dog: { fallback: "Dog", className: "bg-secondary text-muted-foreground" },
};

/** Quiet class chip with the popularity/profit rationale on hover. */
function ClassChip({ r }: { r: MarginLedgerRow }) {
  const { t } = useTranslation();
  if (!r.class) return null;
  const meta = CLASS_META[r.class];
  if (!meta) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "shrink-0 cursor-default rounded-full px-2 py-0.5 text-[11px] font-medium focus-visible:outline-2 focus-visible:outline-ring",
            meta.className,
          )}
        >
          {t(`insights.class.${r.class}`, meta.fallback)}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {t("insights.class.tooltip", {
          popularity: r.popularity_pct ?? 0,
          defaultValue: "Popularity {{popularity}}% of units · profit vs menu average",
        })}
      </TooltipContent>
    </Tooltip>
  );
}

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
  const [view, setView] = useState<LedgerView>("table");
  const [classFilter, setClassFilter] = useState<string>(ALL_CLASSES);
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

  const logoUrl = useExportLogo();
  const [exporting, setExporting] = useState(false);

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
      // The signal's evidence rides along so the decision log can show WHAT
      // was suggested/measured at the moment of the decision.
      detail: signal.params ?? {},
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
        <PageHeader title={t("insights.profitability.title", "Menu profitability")} />
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
      accent: "neutral",
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
          ? t("insights.profitability.shareOfRevenue", {
              pct: fmtPercent(totals.margin_pct / 100),
              defaultValue: "{{pct}} of revenue",
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

  const rows = (report?.rows ?? []).filter(
    (r) =>
      (!flaggedOnly || r.flags.length > 0) &&
      (classFilter === ALL_CLASSES || r.class === classFilter),
  );

  /**
   * Export the currently-visible (filtered) ledger.
   *
   * The margin ledger arrives as ONE report for the whole date range — there is
   * no paging to walk — so `rows` above, already narrowed by the flagged/class
   * filters, is exactly what the file should say.
   */
  const handleExport = async () => {
    type Row = Record<string, string | number | null>;
    const cols: ExcelColumn<Row>[] = [
      { header: t("insights.columns.item", "Item"), accessor: (r) => r.item, type: "text", width: 28 },
      { header: t("insights.columns.size", "Size"), accessor: (r) => r.size, type: "text", width: 10 },
      { header: t("insights.class.all", "All classes"), accessor: (r) => r.cls, type: "text", width: 12 },
      { header: t("insights.columns.sold", "Sold"), accessor: (r) => r.sold, type: "number", width: 10 },
      { header: t("insights.columns.revenue", "Revenue"), accessor: (r) => r.revenue, type: "money", width: 14 },
      { header: t("insights.columns.cost", "Cost"), accessor: (r) => r.cost, type: "money", width: 14 },
      { header: t("insights.columns.margin", "Margin"), accessor: (r) => r.margin, type: "money", width: 14 },
      { header: t("insights.columns.marginPct", "Margin %"), accessor: (r) => r.marginPct, type: "number", width: 10 },
      { header: t("insights.columns.flags", "Flags"), accessor: (r) => r.flags, type: "text", width: 30 },
    ];
    const data: Row[] = rows.map((r) => ({
      item: r.item_name,
      size: r.size_label,
      cls: r.class ? t(`insights.class.${r.class}`, r.class) : "",
      sold: r.quantity_sold,
      revenue: r.revenue,
      cost: r.cost ?? null,
      margin: r.margin ?? null,
      marginPct: r.margin_pct != null ? Math.round(r.margin_pct * 10) / 10 : null,
      flags: r.flags.map((f) => f.kind).join(", "),
    }));
    const title = t("insights.profitability.title", "Menu profitability");
    setExporting(true);
    try {
      await exportToExcel({
        filename: `Madar-${title}`,
        logoUrl,
        sheets: [{ name: title, title, rows: data as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    type Row = Record<string, string | number | null>;
    const cols: ExcelColumn<Row>[] = [
      { header: t("insights.columns.item", "Item"), accessor: (r) => r.item, type: "text" },
      { header: t("insights.columns.size", "Size"), accessor: (r) => r.size, type: "text" },
      { header: t("insights.class.all", "All classes"), accessor: (r) => r.cls, type: "text" },
      { header: t("insights.columns.sold", "Sold"), accessor: (r) => r.sold, type: "number" },
      { header: t("insights.columns.revenue", "Revenue"), accessor: (r) => r.revenue, type: "money" },
      { header: t("insights.columns.cost", "Cost"), accessor: (r) => r.cost, type: "money" },
      { header: t("insights.columns.margin", "Margin"), accessor: (r) => r.margin, type: "money" },
      { header: t("insights.columns.marginPct", "Margin %"), accessor: (r) => r.marginPct, type: "number" },
      { header: t("insights.columns.flags", "Flags"), accessor: (r) => r.flags, type: "text" },
    ];
    const data: Row[] = rows.map((r) => ({
      item: r.item_name,
      size: r.size_label,
      cls: r.class ? t(`insights.class.${r.class}`, r.class) : "",
      sold: r.quantity_sold,
      revenue: r.revenue,
      cost: r.cost ?? null,
      margin: r.margin ?? null,
      marginPct: r.margin_pct != null ? Math.round(r.margin_pct * 10) / 10 : null,
      flags: r.flags.map((f) => f.kind).join(", "),
    }));
    const title = t("insights.profitability.title", "Menu profitability");
    try {
      await exportToCsv({
        filename: `Madar-${title}`,
        sheets: [{ name: title, title, rows: data as Record<string, unknown>[], columns: cols as unknown as ExcelColumn<Record<string, unknown>>[] }],
      });
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const columns: ColumnDef<MarginLedgerRow>[] = [
    {
      id: "item",
      header: t("insights.columns.item", "Item"),
      meta: { label: t("insights.columns.item", "Item"), phone: "title" },
      cell: ({ row: { original: r } }) => <ItemCell r={r} />,
    },
    {
      id: "sold",
      header: t("insights.columns.sold", "Sold"),
      meta: { label: t("insights.columns.sold", "Sold"), numeric: true },
      cell: ({ row: { original: r } }) => <SoldCell r={r} />,
    },
    {
      id: "revenue",
      header: t("insights.columns.revenue", "Revenue"),
      meta: { label: t("insights.columns.revenue", "Revenue"), numeric: true },
      cell: ({ row }) => fmtMoney(row.original.revenue),
    },
    {
      id: "cost",
      header: t("insights.columns.cost", "Cost"),
      meta: { label: t("insights.columns.cost", "Cost"), numeric: true },
      cell: ({ row }) => fmtMoney(row.original.cost),
    },
    {
      id: "margin",
      header: t("insights.columns.margin", "Margin"),
      meta: { label: t("insights.columns.margin", "Margin"), numeric: true },
      cell: ({ row: { original: r } }) => (
        <span className={cn(r.margin != null && r.margin < 0 && TINT.danger)}>{fmtMoney(r.margin)}</span>
      ),
    },
    {
      id: "marginPct",
      header: t("insights.columns.marginPct", "Margin %"),
      meta: { label: t("insights.columns.marginPct", "Margin %"), numeric: true },
      cell: ({ row: { original: r } }) => {
        const below = r.margin_pct != null && report?.target_pct != null && r.margin_pct < report.target_pct;
        return <span className={cn(below && TINT.warning)}>{r.margin_pct == null ? "—" : fmtPercent(r.margin_pct / 100)}</span>;
      },
    },
    {
      id: "share",
      header: t("insights.columns.share", "Share %"),
      meta: { label: t("insights.columns.share", "Share %"), numeric: true },
      cell: ({ row: { original: r } }) => (
        <span className="text-muted-foreground">{r.margin_share_pct == null ? "—" : fmtPercent(r.margin_share_pct / 100)}</span>
      ),
    },
    {
      id: "flags",
      header: t("insights.columns.flags", "Flags"),
      meta: { label: t("insights.columns.flags", "Flags") },
      cell: ({ row: { original: r } }) =>
        r.flags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {r.flags.map((sig) => (
              <FlagChip
                key={sig.kind}
                signal={sig}
                busy={createDecision.isPending}
                onFix={(x) => fix(r, x)}
                onDecide={(x, action) => decide(r, x, action)}
              />
            ))}
          </div>
        ) : null,
    },
  ];

  return (
    <Page>
      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <PageHeader
          title={t("insights.profitability.title", "Menu profitability")}
          subtitle={
            loading ? (
              <Skeleton className="mt-1 h-5 w-44" />
            ) : report ? (
              <TargetEditor
                orgId={orgId}
                branchId={branchId}
                targetPct={report.target_pct}
                targetSource={report.target_source}
              />
            ) : null
          }
          actions={
            <SegmentedControl<CostBasis>
              value={basis}
              onChange={setBasis}
              options={[
                { value: "snapshot", label: t("insights.profitability.basisSnapshot", "Snapshot") },
                { value: "current", label: t("insights.profitability.basisCurrent", "Today's costs") },
              ]}
            />
          }
          below={
            <PageTabsList>
              <PageTabsTrigger value="ledger" className="first:ps-0">{t("insights.profitability.ledgerTab", "Ledger")}</PageTabsTrigger>
              <PageTabsTrigger value="repricing">{t("insights.profitability.repricingTab", "Repricing")}</PageTabsTrigger>
              <PageTabsTrigger value="decisions">{t("insights.profitability.decisionsTab", "Decisions")}</PageTabsTrigger>
            </PageTabsList>
          }
        />

        <div className="space-y-2">
          <LedgerStrip items={strip} />
          {report && report.rows_cost_unknown > 0 ? (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Info aria-hidden className="size-4 shrink-0" />
              {t("insights.profitability.costUnknownNote", {
                count: report.rows_cost_unknown,
                defaultValue: "{{count}} items excluded from margin — cost unknown",
              })}
            </p>
          ) : null}
        </div>

        <TabsContent value="ledger" className="space-y-3">
          <SegmentedControl<LedgerView>
            value={view}
            onChange={setView}
            options={[
              { value: "table", label: t("insights.profitability.viewTable", "Table") },
              { value: "quadrant", label: t("insights.profitability.viewQuadrant", "Quadrant") },
            ]}
          />
          {view === "quadrant" ? (
            rows.length > 0 ? (
              <QuadrantView rows={rows} />
            ) : (
              <EmptyState title={t("insights.profitability.noRows", "No sales in this period")} />
            )
          ) : (
          <DataTable
            columns={columns}
            data={rows}
            loading={loading}
            error={ledger.error}
            onRetry={() => void ledger.refetch()}
            getRowId={(r) => `${r.menu_item_id}-${r.size_label}`}
            hideViewOptions
            pageSize={50}
            toolbar={
              <div className="flex flex-wrap items-center gap-3">
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="h-9 w-auto min-w-36 text-sm" aria-label={t("insights.class.all", "All classes")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CLASSES}>{t("insights.class.all", "All classes")}</SelectItem>
                    {Object.entries(CLASS_META).map(([k, m]) => (
                      <SelectItem key={k} value={k}>{t(`insights.class.${k}`, m.fallback)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Switch id="insights-flagged-only" checked={flaggedOnly} onCheckedChange={setFlaggedOnly} />
                  <Label htmlFor="insights-flagged-only" className="text-sm font-normal text-muted-foreground">
                    {t("insights.profitability.flaggedOnly", "Flagged only")}
                  </Label>
                </div>
                <ExportButton size="sm" onExport={handleExport} onExportCsv={handleExportCsv} loading={exporting} disabled={rows.length === 0} />
              </div>
            }
            emptyState={
              <EmptyState
                title={
                  flaggedOnly
                    ? t("insights.profitability.noFlags", "Nothing flagged — margins look healthy")
                    : t("insights.profitability.noRows", "No sales in this period")
                }
              />
            }
          />
          )}
        </TabsContent>

        <TabsContent value="repricing">
          <RepricingTab scopeBranchId={scopeBranchId} />
        </TabsContent>

        <TabsContent value="decisions">
          <DecisionsTab orgId={orgId} branchId={branchId} />
        </TabsContent>
      </Tabs>
    </Page>
  );
}

function ItemCell({ r }: { r: MarginLedgerRow }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="max-w-56 truncate font-medium">{r.item_name}</span>
      {r.size_label !== "one_size" ? <Badge variant="outline" className="shrink-0">{r.size_label}</Badge> : null}
      <ClassChip r={r} />
      {!r.on_menu ? (
        <Badge variant="secondary" className="shrink-0">
          {t("insights.profitability.offMenu", "Off menu")}
        </Badge>
      ) : null}
    </div>
  );
}

function SoldCell({ r }: { r: MarginLedgerRow }) {
  const { t } = useTranslation();
  const qtyDelta = r.quantity_sold - r.prev_quantity;
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
      {fmtNumber(r.quantity_sold)}
      {qtyDelta !== 0 ? (
        <span
          className={cn("inline-flex items-center text-xs", qtyDelta > 0 ? TINT.success : TINT.danger)}
          title={t("insights.profitability.vsPrev", "vs previous period")}
        >
          {qtyDelta > 0 ? <ArrowUpRight aria-hidden className="size-3" /> : <ArrowDownRight aria-hidden className="size-3" />}
          {fmtNumber(Math.abs(qtyDelta))}
        </span>
      ) : null}
    </span>
  );
}
