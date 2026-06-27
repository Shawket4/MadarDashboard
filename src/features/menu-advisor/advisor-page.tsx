import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { AlertCircle, ArrowDownRight, ArrowUpRight, Loader2, PackagePlus, RefreshCw, Sparkles, Tag, Trash2 } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { SuggestionCard } from "@/components/app/suggestion-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fmtDateTimeFull, fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { useScope } from "@/data/scope/use-scope";
import { getErrorMessage } from "@/data/api/errors";
import {
  useCreateRunHandler, useGetActiveRunHandler, useGetLatestRunHandler,
  useListBundleSuggestionsHandler, useListPriceSuggestionsHandler, useListRemovalScenariosHandler,
  useRecordDecisionHandler,
} from "@/data/api/generated/api";
import type { BundleSuggestionRecord, Classification, PriceSuggestionRecord, RemovalScenarioRecord } from "@/data/api/generated/models";

const TONE: Record<string, string> = {
  success: "border-transparent bg-success/15 text-success",
  destructive: "border-transparent bg-destructive/15 text-destructive",
  warning: "border-transparent bg-warning/15 text-warning",
  neutral: "",
};

function classificationTag(c: Classification): { key: string; fallback: string; className: string } | null {
  if (c.mode === "cm") {
    const tone: Record<string, string> = { star: "success", dog: "destructive", puzzle: "warning", plowhorse: "neutral" };
    return { key: `menuAdvisor.quadrant.${c.quadrant}`, fallback: c.quadrant, className: TONE[tone[c.quadrant] ?? "neutral"] };
  }
  if (c.mode === "revenue") {
    const tone: Record<string, string> = { hero: "success", quiet: "destructive", slow: "warning", steady: "neutral" };
    return { key: `menuAdvisor.revenueClass.${c.class}`, fallback: c.class, className: TONE[tone[c.class] ?? "neutral"] };
  }
  return null;
}

type Kind = "price" | "bundle" | "removal";
type Decide = (id: string, kind: Kind, decision: string) => void;

function PriceItem({ record, onDecide, pendingId }: { record: PriceSuggestionRecord; onDecide: Decide; pendingId: string | null }) {
  const { t } = useTranslation();
  const tag = classificationTag(record.classification);
  const tags = tag ? [{ label: t(tag.key, tag.fallback), className: tag.className }] : [];
  if (record.cost_missing) tags.push({ label: t("menuAdvisor.costMissing", "Cost missing"), className: TONE.neutral });
  if (record.price_changed_in_window) tags.push({ label: t("menuAdvisor.recentlyRepriced", "Recently repriced"), className: TONE.warning });
  const Arrow = record.action === "raise_price" ? ArrowUpRight : ArrowDownRight;
  return (
    <SuggestionCard
      title={record.item_name}
      subtitle={record.key.size_label !== "one_size" ? t("menuAdvisor.size", { size: record.key.size_label, defaultValue: `Size ${record.key.size_label}` }) : undefined}
      tags={tags}
      decision={record.decision?.decision}
      pending={pendingId === record.id}
      onAccept={() => onDecide(record.id, "price", "accepted")}
      onReject={() => onDecide(record.id, "price", "rejected")}
      onIgnore={() => onDecide(record.id, "price", "ignored")}
      content={
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{record.explanation}</p>
          <div className="flex flex-wrap items-center gap-6 rounded-lg bg-muted/50 p-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">{t("menuAdvisor.currentPrice", "Current price")}</p>
              <p className="text-lg font-semibold tabular line-through opacity-70">{fmtMoney(record.current_price)}</p>
            </div>
            {record.suggested_price != null ? (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">{t("menuAdvisor.suggestedPrice", "Suggested price")}</p>
                <p className="flex items-center gap-1 text-lg font-bold tabular text-primary">
                  {fmtMoney(record.suggested_price)}
                  <Arrow className={cn("size-4 rtl:-scale-x-100", record.action === "raise_price" ? "text-success" : "text-destructive")} />
                </p>
              </div>
            ) : null}
            {record.margin_pct != null ? (
              <div className="ms-auto text-end">
                <p className="mb-1 text-xs text-muted-foreground">{t("menuAdvisor.currentMargin", "Margin")}</p>
                <p className="text-sm font-semibold tabular">{fmtPercent(record.margin_pct)}</p>
              </div>
            ) : null}
          </div>
        </div>
      }
    />
  );
}

function BundleItem({ record, onDecide, pendingId }: { record: BundleSuggestionRecord; onDecide: Decide; pendingId: string | null }) {
  const { t } = useTranslation();
  const tags = [{ label: t("menuAdvisor.bundleOpportunity", "Bundle opportunity"), className: TONE.success }];
  if (record.missing_costs) tags.push({ label: t("menuAdvisor.costMissing", "Cost missing"), className: TONE.neutral });
  return (
    <SuggestionCard
      title={t("menuAdvisor.bundleTitle", { count: record.bundle_items.length, defaultValue: `Bundle of ${record.bundle_items.length}` })}
      subtitle={t("menuAdvisor.frequentlyBoughtTogether", "Frequently bought together")}
      tags={tags}
      decision={record.decision?.decision}
      pending={pendingId === record.id}
      onAccept={() => onDecide(record.id, "bundle", "accepted")}
      onReject={() => onDecide(record.id, "bundle", "rejected")}
      onIgnore={() => onDecide(record.id, "bundle", "ignored")}
      content={
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{record.explanation}</p>
          <div className="grid grid-cols-2 gap-4 pt-1 sm:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">{t("menuAdvisor.listPrice", "List price")}</p><p className="font-semibold tabular">{fmtMoney(record.bundle_list_price)}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("menuAdvisor.bundlePrice", "Bundle price")}</p><p className="font-semibold tabular text-primary">{fmtMoney(record.bundle_suggested_price)}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("menuAdvisor.discount", "Discount")}</p><p className="font-semibold tabular text-success">{fmtPercent(record.bundle_discount_pct)}</p></div>
            <div><p className="text-xs text-muted-foreground">{t("menuAdvisor.estUplift", "Est. uplift")}</p><p className="font-semibold tabular" dir="ltr">+{fmtNumber(record.forecast.total_units_uplift_x)}×</p></div>
          </div>
        </div>
      }
    />
  );
}

function RemovalItem({ record, onDecide, pendingId }: { record: RemovalScenarioRecord; onDecide: Decide; pendingId: string | null }) {
  const { t } = useTranslation();
  return (
    <SuggestionCard
      title={record.item_name}
      tags={[{ label: t(`menuAdvisor.removalRec.${record.recommendation}`, record.recommendation), className: TONE.destructive }]}
      decision={record.decision?.decision}
      pending={pendingId === record.id}
      onAccept={() => onDecide(record.id, "removal", "accepted")}
      onReject={() => onDecide(record.id, "removal", "rejected")}
      onIgnore={() => onDecide(record.id, "removal", "ignored")}
      content={
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{record.explanation}</p>
          <div className="flex gap-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
            <Trash2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t("menuAdvisor.netCmImpact", "Net margin impact")}</p>
              <p className="text-lg font-bold tabular" dir="ltr">{fmtMoney(record.net_cm_change)} {t("menuAdvisor.perMonth", "/ month")}</p>
            </div>
          </div>
        </div>
      }
    />
  );
}

export function MenuAdvisorPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { branchId } = useScope();
  const branch = branchId ?? "";

  const activeRun = useGetActiveRunHandler(branch, { query: { enabled: !!branchId, refetchInterval: (q) => (q.state.data ? 5000 : false) } });
  const latestRun = useGetLatestRunHandler(branch, undefined, { query: { enabled: !!branchId } });
  const runId = latestRun.data?.id;

  const price = useListPriceSuggestionsHandler(runId ?? "", undefined, { query: { enabled: !!runId } });
  const bundle = useListBundleSuggestionsHandler(runId ?? "", undefined, { query: { enabled: !!runId } });
  const removal = useListRemovalScenariosHandler(runId ?? "", undefined, { query: { enabled: !!runId } });

  // Invalidate all menu-advisor queries (run metadata + suggestion lists).
  // Used after createRun so the new active run is picked up immediately.
  const invalidateAdvisor = () =>
    qc.invalidateQueries({
      predicate: (q) =>
        typeof q.queryKey[0] === "string" &&
        (q.queryKey[0] as string).startsWith("/menu-advisor"),
    });

  // Invalidate only the per-run suggestion lists (price / bundle / removal).
  // Used after recordDecision: the run metadata is unaffected by a decision,
  // so there is no need to re-fetch activeRun or latestRun.
  const invalidateSuggestions = () =>
    qc.invalidateQueries({
      predicate: (q) =>
        typeof q.queryKey[0] === "string" &&
        (q.queryKey[0] as string).startsWith("/menu-advisor/runs/"),
    });

  // When the active run finishes (present → null), refresh the latest run.
  const prevActive = useRef<unknown>(null);
  useEffect(() => {
    const curr = activeRun.data ?? null;
    if (prevActive.current && !curr) invalidateAdvisor();
    prevActive.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRun.data]);

  const createRun = useCreateRunHandler({
    mutation: {
      onSuccess: invalidateAdvisor,
      onError: (e) => {
        if (isAxiosError(e) && e.response?.status === 409) { invalidateAdvisor(); return; }
        toast.error(getErrorMessage(e));
      },
    },
  });
  const decide = useRecordDecisionHandler({ mutation: { onSuccess: invalidateSuggestions, onError: (e) => toast.error(getErrorMessage(e)) } });
  const pendingId = decide.isPending ? (decide.variables?.data.suggestion_id ?? null) : null;

  const startRun = () => { if (branchId) createRun.mutate({ branchId: branch, data: {} }); };
  const onDecide: Decide = (id, kind, decision) => { if (branchId) decide.mutate({ data: { suggestion_id: id, suggestion_kind: kind, branch_id: branch, decision } }); };

  const run = latestRun.data;
  const analyzing = !!activeRun.data || run?.status === "in_progress";

  const body = () => {
    if (!branchId) return <EmptyState icon={Sparkles} title={t("menuAdvisor.selectBranch", "Select a branch")} description={t("menuAdvisor.selectBranchDesc", "Pick a branch from the scope bar to see its insights.")} />;
    if (analyzing) return (
      <Card className="border-muted bg-muted/20"><CardContent className="space-y-4 p-12 text-center">
        <Loader2 className="mx-auto size-12 animate-spin text-muted-foreground" />
        <h3 className="text-xl font-bold">{t("menuAdvisor.analyzing", "Analyzing your menu…")}</h3>
        <p className="mx-auto max-w-md text-muted-foreground">{t("menuAdvisor.analyzingDesc", "Crunching sales, costs and baskets. This takes a moment.")}</p>
      </CardContent></Card>
    );
    if (latestRun.isLoading || activeRun.isLoading) return <div className="space-y-4"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
    if (run?.status === "failed") return (
      <Card className="border-destructive/30 bg-destructive/5"><CardContent className="space-y-4 p-12 text-center">
        <AlertCircle className="mx-auto size-12 text-destructive" />
        <h3 className="text-xl font-bold">{t("menuAdvisor.runFailed", "Analysis failed")}</h3>
        <p className="mx-auto max-w-md text-muted-foreground">{run.error_message || t("menuAdvisor.runFailedDesc", "Something went wrong generating insights.")}</p>
        <Button onClick={startRun} loading={createRun.isPending}><RefreshCw className="size-4" /> {t("menuAdvisor.runAgain", "Run again")}</Button>
      </CardContent></Card>
    );
    if (!run) return <EmptyState icon={Sparkles} title={t("menuAdvisor.noInsights", "No insights yet")} description={t("menuAdvisor.noInsightsDesc", "Generate your first analysis to see pricing and bundle ideas.")} action={<Button onClick={startRun} loading={createRun.isPending}><RefreshCw className="size-4" /> {t("menuAdvisor.generateInsights", "Generate insights")}</Button>} />;

    const prices = price.data ?? [];
    const bundles = bundle.data ?? [];
    const removals = removal.data ?? [];
    const hasData = prices.length || bundles.length || removals.length;
    if (!hasData && !price.isLoading) return <EmptyState icon={AlertCircle} title={t("menuAdvisor.noSuggestions", "No suggestions")} description={t("menuAdvisor.noSuggestionsDesc", "The latest run found nothing actionable. Try again after more sales.")} action={<Button variant="outline" onClick={startRun} loading={createRun.isPending}><RefreshCw className="size-4" /> {t("menuAdvisor.runAgain", "Run again")}</Button>} />;

    return (
      <div className="max-w-5xl space-y-10 pb-12">
        <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-medium">{t("menuAdvisor.latestRun", "Latest run")} · {fmtDateTimeFull(run.started_at)}</p>
            <p className="text-xs text-muted-foreground">{t("menuAdvisor.status", "Status")}: {run.status}</p>
          </div>
          <Button onClick={startRun} loading={createRun.isPending} variant="outline" size="sm"><RefreshCw className="size-4" /> {t("menuAdvisor.refreshAnalysis", "Refresh")}</Button>
        </div>

        {prices.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2"><Tag className="size-5 text-primary" /><h2 className="text-xl font-bold tracking-tight">{t("menuAdvisor.quickPricingWins", "Quick pricing wins")}</h2></div>
            <p className="text-sm text-muted-foreground">{t("menuAdvisor.quickPricingWinsDesc", "Items where a price tweak likely lifts profit.")}</p>
            <div className="grid gap-4">{prices.map((s) => <PriceItem key={s.id} record={s} onDecide={onDecide} pendingId={pendingId} />)}</div>
          </section>
        ) : null}

        {bundles.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2"><PackagePlus className="size-5 text-success" /><h2 className="text-xl font-bold tracking-tight">{t("menuAdvisor.menuPairings", "Menu pairings")}</h2></div>
            <p className="text-sm text-muted-foreground">{t("menuAdvisor.menuPairingsDesc", "Items frequently bought together — bundle them.")}</p>
            <div className="grid gap-4 md:grid-cols-2">{bundles.map((s) => <BundleItem key={s.id} record={s} onDecide={onDecide} pendingId={pendingId} />)}</div>
          </section>
        ) : null}

        {removals.length > 0 ? (
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2"><Trash2 className="size-5 text-destructive" /><h2 className="text-xl font-bold tracking-tight">{t("menuAdvisor.menuCleanup", "Menu cleanup")}</h2></div>
            <p className="text-sm text-muted-foreground">{t("menuAdvisor.menuCleanupDesc", "Underperformers you could remove with little downside.")}</p>
            <div className="grid gap-4 md:grid-cols-2">{removals.map((s) => <RemovalItem key={s.id} record={s} onDecide={onDecide} pendingId={pendingId} />)}</div>
          </section>
        ) : null}
      </div>
    );
  };

  return (
    <Page>
      <PageHeader title={t("menuAdvisor.title", "Menu Advisor")} description={t("menuAdvisor.subtitle", "Data-driven pricing, bundling and cleanup suggestions")} />
      {body()}
    </Page>
  );
}
