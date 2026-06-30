import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { AlertCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  completeOnboarding,
  getGetOnboardingQueryOptions,
  useGetOnboarding,
  useGetOrg,
} from "@/data/api/generated/api";
import type { OnboardingStep } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import { useOrgId } from "@/hooks/use-org-id";

import { Celebration } from "./celebration";
import { DashboardMirror } from "./dashboard-mirror";
import { StepNavigator } from "./step-navigator";
import { StepPanel } from "./step-panel";
import { ONBOARDING_SKIP_KEY, STEPS, type StepKey } from "./config";

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orgId = useOrgId();
  const [active, setActive] = useState<StepKey | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const q = useGetOnboarding(orgId ?? "", { query: { enabled: !!orgId } });
  const orgQ = useGetOrg(orgId ?? "", { query: { enabled: !!orgId } });
  const status = q.data;

  const byKey = useMemo(() => {
    const m = new Map<string, OnboardingStep>();
    status?.steps.forEach((s) => m.set(s.key, s));
    return m;
  }, [status]);

  const firstIncomplete = useMemo<StepKey>(() => {
    const next = STEPS.find((s) => s.statusKey && !byKey.get(s.statusKey)?.done);
    return next?.key ?? "go_live";
  }, [byKey]);

  const activeKey = active ?? firstIncomplete;
  const activeIndex = STEPS.findIndex((s) => s.key === activeKey);
  const canComplete = !!status?.can_complete;

  const requiredDone = (status?.steps ?? []).filter((s) => s.required && s.done).length;
  const requiredTotal = (status?.steps ?? []).filter((s) => s.required).length;
  const progress = requiredTotal ? requiredDone / requiredTotal : 0;
  const pct = Math.round(progress * 100);
  const cheer =
    pct >= 100
      ? t("onboarding.cheer.done", "Ready to open!")
      : pct >= 75
        ? t("onboarding.cheer.most", "Almost there!")
        : pct >= 50
          ? t("onboarding.cheer.half", "Halfway there!")
          : pct > 0
            ? t("onboarding.cheer.start", "Nice start!")
            : t("onboarding.cheer.go", "Let's go!");

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: getGetOnboardingQueryOptions(orgId ?? "").queryKey });

  const goTo = (i: number) => setActive(STEPS[Math.max(0, Math.min(STEPS.length - 1, i))].key);

  const finish = async () => {
    if (!orgId) return;
    setFinishing(true);
    try {
      const updated = await completeOnboarding(orgId);
      // Seed the cache synchronously so the /_app gate sees `completed: true`
      // immediately and doesn't bounce us back into the wizard on landing.
      queryClient.setQueryData(getGetOnboardingQueryOptions(orgId).queryKey, updated);
      // Celebrate, then drop them into their dashboard.
      setCelebrating(true);
      await new Promise((r) => setTimeout(r, 1800));
      void navigate({ to: "/" });
    } catch (e) {
      toast.error(getErrorMessage(e));
      setFinishing(false);
    }
  };

  const skip = () => {
    try {
      sessionStorage.setItem(ONBOARDING_SKIP_KEY, "1");
    } catch {
      /* private mode — gate just falls through to the dashboard anyway */
    }
    void navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      {celebrating ? <Celebration /> : null}
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        {/* Top bar */}
        <header className="mb-8 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight">{t("onboarding.title", "Let's open your café")}</h1>
            <p className="text-sm text-muted-foreground">{t("onboarding.subtitle", "A few quick steps — watch your dashboard come to life as you go.")}</p>
          </div>
          <Button variant="ghost" onClick={skip}>{t("onboarding.skip", "Skip for now")}</Button>
        </header>

        {/* Required-progress — playful "X% ready" + a cheer */}
        <div className="mb-8">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
            <span className="text-muted-foreground">
              {t("onboarding.readyPct", { pct, defaultValue: `${pct}% ready to open` })}
            </span>
            <span className="text-brand">{cheer}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out motion-reduce:transition-none"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {q.isError ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
            <AlertCircle className="size-8 text-destructive" aria-hidden="true" />
            <p className="text-sm font-semibold text-destructive">{t("onboarding.loadError", "Couldn't load your setup")}</p>
            <Button variant="outline" size="sm" onClick={() => q.refetch()}>{t("common.refresh", "Retry")}</Button>
          </div>
        ) : q.isLoading || !orgId ? (
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.05fr)]">
            <Skeleton className="hidden h-96 lg:block" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.05fr)]">
            <aside className="hidden lg:block">
              <StepNavigator byKey={byKey} activeKey={activeKey} onSelect={setActive} canComplete={canComplete} />
            </aside>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <StepPanel
                orgId={orgId}
                activeKey={activeKey}
                byKey={byKey}
                canComplete={canComplete}
                refresh={refresh}
                onPrev={() => goTo(activeIndex - 1)}
                onNext={() => goTo(activeIndex + 1)}
                isFirst={activeIndex <= 0}
                onFinish={finish}
                finishing={finishing}
              />
            </section>

            <section>
              <DashboardMirror
                byKey={byKey}
                recipeCoverage={status?.recipe_coverage ?? 0}
                orgName={orgQ.data?.name}
                orgLogo={orgQ.data?.logo_url}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
