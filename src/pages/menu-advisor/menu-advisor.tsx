import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, ArrowUpRight, ArrowDownRight, RefreshCw, Trash2, Tag, PackagePlus, AlertCircle } from "lucide-react";
import { PageShell } from "@/shared/ui/page-shell";
import { useCurrentContext } from "@/shared/hooks/use-current-context";
import { useBranches } from "@/entities/branch/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { SuggestionCard } from "@/shared/ui/suggestion-card";
import { fmtMoney, fmtNumber } from "@/shared/lib/format";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

import { 
  useLatestRun, 
  useActiveRun, 
  useCreateRun, 
  usePriceSuggestions, 
  useBundleSuggestions, 
  useRemovalScenarios,
  useRecordDecision
} from "@/entities/menu-advisor/queries";

import type { PriceSuggestionRecord, BundleSuggestionRecord, RemovalScenarioRecord, Decision } from "@/entities/menu-advisor/schemas";

function PriceSuggestionItem({ record, onDecide, isPending }: { record: PriceSuggestionRecord, onDecide: (id: string, kind: "price", d: Decision) => void, isPending: boolean }) {
  const { t } = useTranslation();
  const sug = record.suggestion;
  
  const tags = [];
  if (sug.cm_quadrant) {
    tags.push({ 
      label: sug.cm_quadrant, 
      variant: sug.cm_quadrant === "star" ? "success" : 
               sug.cm_quadrant === "dog" ? "destructive" : 
               sug.cm_quadrant === "puzzle" ? "warning" : "secondary" 
    } as const);
  }
  
  const ArrowIcon = sug.action === "raise_price" ? ArrowUpRight : ArrowDownRight;
  
  return (
    <SuggestionCard
      title={sug.item_name}
      subtitle={sug.size_label && sug.size_label !== "one_size" ? t("menuAdvisor.size", { size: sug.size_label }) : undefined}
      tags={tags}
      decision={record.decision?.decision}
      isAccepting={isPending}
      isRejecting={isPending}
      isIgnoring={isPending}
      onAccept={() => onDecide(record.id, "price", "accepted")}
      onReject={() => onDecide(record.id, "price", "rejected")}
      onIgnore={() => onDecide(record.id, "price", "ignored")}
      content={
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{sug.explanation}</p>
          <div className="flex items-center gap-6 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("menuAdvisor.currentPrice")}</p>
              <p className="font-mono font-semibold text-lg line-through opacity-70">{fmtMoney(sug.current_price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{t("menuAdvisor.suggestedPrice")}</p>
              <p className="font-mono font-bold text-lg text-primary flex items-center gap-1">
                {fmtMoney(sug.suggested_price)}
                <ArrowIcon className={sug.action === "raise_price" ? "text-success w-4 h-4 rtl:scale-x-[-1]" : "text-destructive w-4 h-4 rtl:scale-x-[-1]"} />
              </p>
            </div>
            {sug.margin_pct !== undefined && (
              <div className="ms-auto text-end">
                <p className="text-xs text-muted-foreground mb-1">{t("menuAdvisor.currentMargin")}</p>
                <p className="font-semibold text-sm">{(sug.margin_pct * 100).toFixed(1)}%</p>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}

function BundleSuggestionItem({ record, onDecide, isPending }: { record: BundleSuggestionRecord, onDecide: (id: string, kind: "bundle", d: Decision) => void, isPending: boolean }) {
  const { t } = useTranslation();
  const sug = record.suggestion;
  
  return (
    <SuggestionCard
      title={`Bundle: ${sug.focus_item.menu_item_id.substring(0,6)}...`}
      subtitle={t("menuAdvisor.frequentlyBoughtTogether")}
      decision={record.decision?.decision}
      isAccepting={isPending}
      isRejecting={isPending}
      isIgnoring={isPending}
      onAccept={() => onDecide(record.id, "bundle", "accepted")}
      onReject={() => onDecide(record.id, "bundle", "rejected")}
      onIgnore={() => onDecide(record.id, "bundle", "ignored")}
      content={
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{sug.explanation}</p>
          
          <div className="text-sm space-y-1 p-3 rounded-lg bg-muted/50 border">
            <p className="font-semibold">{t("menuAdvisor.itemsInBundle")}</p>
            <ul className="list-disc list-inside text-muted-foreground ps-1">
              <li>{sug.focus_item.menu_item_id}</li>
              {sug.bundle_items.map((item, i) => (
                <li key={i}>{item.menu_item_id}</li>
              ))}
            </ul>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <p className="text-xs text-muted-foreground">{t("menuAdvisor.listPrice")}</p>
              <p className="font-semibold">{fmtMoney(sug.bundle_list_price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("menuAdvisor.bundlePrice")}</p>
              <p className="font-semibold text-primary">{fmtMoney(sug.bundle_suggested_price)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("menuAdvisor.discount")}</p>
              <p className="font-semibold text-emerald-600">{(sug.bundle_discount_pct * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("menuAdvisor.estUplift")}</p>
              <p className="font-semibold" dir="ltr">+{fmtNumber(sug.forecast.total_units_uplift_x)}x</p>
            </div>
          </div>
        </div>
      }
    />
  );
}

function RemovalScenarioItem({ record, onDecide, isPending }: { record: RemovalScenarioRecord, onDecide: (id: string, kind: "removal", d: Decision) => void, isPending: boolean }) {
  const { t } = useTranslation();
  const sug = record.scenario;
  
  return (
    <SuggestionCard
      title={sug.item_name}
      tags={[{ label: "Prune", variant: "destructive" }]}
      decision={record.decision?.decision}
      isAccepting={isPending}
      isRejecting={isPending}
      isIgnoring={isPending}
      onAccept={() => onDecide(record.id, "removal", "accepted")}
      onReject={() => onDecide(record.id, "removal", "rejected")}
      onIgnore={() => onDecide(record.id, "removal", "ignored")}
      content={
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{sug.explanation}</p>
          <div className="flex gap-4 p-3 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
            <Trash2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{t("menuAdvisor.netCmImpact")}</p>
              <p className="text-lg font-bold" dir="ltr">{fmtMoney(sug.net_cm_change)} {t("menuAdvisor.perMonth")}</p>
            </div>
          </div>
        </div>
      }
    />
  );
}

export default function MenuAdvisorDashboard() {
  const { t } = useTranslation();
  const { orgId, branchId: ctxBranch } = useCurrentContext();
  const { data: branches = [] } = useBranches(orgId);
  const [selBranch, setSelBranch] = useState<string>(ctxBranch ?? "");
  
  useMemo(() => {
    if (!selBranch && branches.length > 0) setSelBranch(branches[0].id);
  }, [branches, selBranch]);

  const { data: activeRun, isLoading: isActiveLoading } = useActiveRun(selBranch || undefined);
  const { data: latestRun, isLoading: isLatestLoading } = useLatestRun(selBranch || undefined);
  
  const runId = latestRun?.id;
  
  const { data: priceSuggestions = [], isLoading: isLoadingPrice } = usePriceSuggestions(runId);
  const { data: bundleSuggestions = [] } = useBundleSuggestions(runId);
  const { data: removalScenarios = [] } = useRemovalScenarios(runId);
  
  const createRunMut = useCreateRun();
  const decideMut = useRecordDecision();

  const handleCreateRun = () => {
    if (!selBranch) return;
    createRunMut.mutate(selBranch);
  };
  
  const handleDecision = (id: string, kind: "price" | "bundle" | "removal", decision: Decision) => {
    if (!selBranch) return;
    decideMut.mutate({ suggestion_id: id, suggestion_kind: kind, branch_id: selBranch, decision });
  };

  const isPending = decideMut.isPending;

  const renderContent = () => {
    if (!selBranch) {
      return <EmptyState icon={Sparkles} title={t("menuAdvisor.selectBranch")} description={t("menuAdvisor.selectBranchDesc")} />;
    }

    if (activeRun) {
      return (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h3 className="text-xl font-bold">{t("menuAdvisor.analyzing")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("menuAdvisor.analyzingDesc")}
            </p>
          </CardContent>
        </Card>
      );
    }
    
    if (isLatestLoading || isActiveLoading) {
      return <div className="space-y-4"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
    }

    if (!latestRun) {
      return (
        <EmptyState 
          icon={Sparkles} 
          title={t("menuAdvisor.noInsights")} 
          description={t("menuAdvisor.noInsightsDesc")}
          action={<Button onClick={handleCreateRun} loading={createRunMut.isPending}><RefreshCw className="w-4 h-4 me-2" /> {t("menuAdvisor.generateInsights")}</Button>}
        />
      );
    }

    const hasData = priceSuggestions.length > 0 || bundleSuggestions.length > 0 || removalScenarios.length > 0;
    
    if (!hasData && !isLoadingPrice) {
      return (
        <EmptyState 
          icon={AlertCircle} 
          title={t("menuAdvisor.noSuggestions")} 
          description={t("menuAdvisor.noSuggestionsDesc")}
          action={<Button onClick={handleCreateRun} loading={createRunMut.isPending} variant="outline"><RefreshCw className="w-4 h-4 me-2" /> {t("menuAdvisor.runAgain")}</Button>}
        />
      );
    }

    return (
      <div className="space-y-12 pb-12 max-w-5xl">
        {/* Actions header */}
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
          <div>
            <p className="text-sm font-medium">{t("menuAdvisor.latestRun")} {new Date(latestRun.created_at).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t("menuAdvisor.status")} {latestRun.status}</p>
          </div>
          <Button onClick={handleCreateRun} loading={createRunMut.isPending} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 me-2" /> {t("menuAdvisor.refreshAnalysis")}
          </Button>
        </div>

        {priceSuggestions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Tag className="text-primary" size={20} />
              <h2 className="text-xl font-bold tracking-tight">{t("menuAdvisor.quickPricingWins")}</h2>
            </div>
            <p className="text-muted-foreground text-sm">{t("menuAdvisor.quickPricingWinsDesc")}</p>
            <div className="grid gap-4">
              {priceSuggestions.map(s => (
                <PriceSuggestionItem key={s.id} record={s} onDecide={handleDecision} isPending={isPending} />
              ))}
            </div>
          </section>
        )}

        {bundleSuggestions.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <PackagePlus className="text-emerald-500" size={20} />
              <h2 className="text-xl font-bold tracking-tight">{t("menuAdvisor.menuPairings")}</h2>
            </div>
            <p className="text-muted-foreground text-sm">{t("menuAdvisor.menuPairingsDesc")}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {bundleSuggestions.map(s => (
                <BundleSuggestionItem key={s.id} record={s} onDecide={handleDecision} isPending={isPending} />
              ))}
            </div>
          </section>
        )}

        {removalScenarios.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Trash2 className="text-danger" size={20} />
              <h2 className="text-xl font-bold tracking-tight">{t("menuAdvisor.menuCleanup")}</h2>
            </div>
            <p className="text-muted-foreground text-sm">{t("menuAdvisor.menuCleanupDesc")}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {removalScenarios.map(s => (
                <RemovalScenarioItem key={s.id} record={s} onDecide={handleDecision} isPending={isPending} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <PageShell
      title={t("menuAdvisor.title")}
      description={t("menuAdvisor.subtitle")}
      action={
        branches.length > 1 && (
          <Select value={selBranch} onValueChange={setSelBranch}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )
      }
    >
      {renderContent()}
    </PageShell>
  );
}
