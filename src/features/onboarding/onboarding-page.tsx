import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight, Check, CreditCard, GitBranch, NotebookPen, PlusCircle, Receipt,
  Sparkles, Sprout, Tags, UtensilsCrossed, Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CoverageRing } from "./coverage-ring";
import { completeOnboarding, useGetOnboarding, getGetOnboardingQueryOptions } from "@/data/api/generated/api";
import { getErrorMessage } from "@/data/api/errors";
import { queryClient } from "@/data/api/query";
import { useOrgId } from "@/hooks/use-org-id";
import { useAppStore } from "@/data/stores/app.store";

// Map each backend step key to the screen that completes it.
const STEP_META: Record<string, { icon: LucideIcon; to: string }> = {
  branch: { icon: GitBranch, to: "/branches" },
  payment_methods: { icon: CreditCard, to: "/settings/payment-methods" },
  categories: { icon: Tags, to: "/menu/items" },
  menu_items: { icon: UtensilsCrossed, to: "/menu/items" },
  ingredients: { icon: Sprout, to: "/menu/recipes" },
  recipes: { icon: NotebookPen, to: "/menu/recipes" },
  addons: { icon: PlusCircle, to: "/menu/items" },
  team: { icon: Users, to: "/users" },
  first_order: { icon: Receipt, to: "/orders" },
};

export function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orgId = useOrgId();
  const orgLogo = useAppStore((s) => s.selectedOrgLogo);
  const [busy, setBusy] = useState(false);

  const q = useGetOnboarding(orgId ?? "", { query: { enabled: !!orgId } });
  const status = q.data;
  const steps = useMemo(() => status?.steps ?? [], [status]);
  const requiredDone = steps.filter((s) => s.required && s.done).length;
  const requiredTotal = steps.filter((s) => s.required).length;

  const finish = async () => {
    if (!orgId) return;
    setBusy(true);
    try {
      await completeOnboarding(orgId);
      void queryClient.invalidateQueries({ queryKey: getGetOnboardingQueryOptions(orgId).queryKey });
      toast.success(t("onboarding.finishedToast", "Setup complete — welcome aboard!"));
      void navigate({ to: "/" });
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
        <header className="flex items-center gap-4">
          {orgLogo ? <img src={orgLogo} alt="" className="size-14 shrink-0 rounded-2xl object-cover" /> : <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground"><Sparkles className="size-6" /></span>}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{t("onboarding.welcome.title", "Welcome to Sufrix")}</h1>
            <p className="text-sm text-muted-foreground">{t("onboarding.welcome.description", "Let's get your restaurant set up. A few quick steps and you're ready to take orders.")}</p>
          </div>
        </header>

        <Card>
          <CardContent className="flex items-center gap-5 p-5">
            <CoverageRing ratio={status?.recipe_coverage ?? 0} label={t("analytics.share", "coverage")} />
            <div className="space-y-1">
              <p className="text-sm font-semibold">{t("onboarding.recipeCoverage", "Recipe cost coverage")}</p>
              <p className="text-xs text-muted-foreground">{t("onboarding.recipeCoverageHint", "Add ingredient recipes so every item has a known cost.")}</p>
              <p className="pt-1 text-xs font-medium">{t("onboarding.progress", { done: requiredDone, total: requiredTotal, defaultValue: `${requiredDone} of ${requiredTotal} required steps done` })}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {q.isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            : steps.map((step) => {
              const meta = STEP_META[step.key] ?? { icon: Check, to: "/" };
              const Icon = meta.icon;
              return (
                <Card key={step.key} className={cn(step.done && "bg-muted/40")}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", step.done ? "bg-success/15 text-success" : "bg-primary/10 text-primary")}>
                      {step.done ? <Check className="size-5" /> : <Icon className="size-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        {t(`onboarding.stepKeys.${step.key}`, step.key)}
                        {!step.required ? <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{t("onboarding.optionalTag", "Optional")}</span> : null}
                      </p>
                      {step.count > 0 ? <p className="text-xs text-muted-foreground">{t("onboarding.countAdded", { count: step.count, defaultValue: `${step.count} added` })}</p> : null}
                    </div>
                    <Button asChild variant={step.done ? "ghost" : "outline"} size="sm">
                      <Link to={meta.to}>{step.done ? t("onboarding.review", "Review") : t("onboarding.setUp", "Set up")} <ArrowRight className="size-4 rtl:rotate-180" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        <div className="flex flex-col gap-3 border-t pt-5">
          <Button size="lg" disabled={!status?.can_complete || busy} loading={busy} onClick={finish}>
            {t("onboarding.finish", "Finish setup")}
          </Button>
          {!status?.can_complete ? <p className="text-center text-xs text-muted-foreground">{t("onboarding.finishHint", "Complete the required steps above to finish.")}</p> : null}
          <Button asChild variant="ghost" size="sm"><Link to="/">{t("onboarding.skipToDashboard", "Skip to dashboard")}</Link></Button>
        </div>
      </div>
    </div>
  );
}
