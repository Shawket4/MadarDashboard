import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetOnboarding } from "@/data/api/generated/api";
import { useOrgId } from "@/hooks/use-org-id";
import { useAuthStore } from "@/data/stores/auth.store";
import { NUDGE_DISMISS_KEY } from "./config";

/**
 * Calm, dismissible "keep building your café" nudge on the dashboard. Shows the
 * remaining setup steps after go-live so the optional ones (recipes, team,
 * add-ons, first order) keep their momentum without blocking work. Hidden once
 * everything is done or the owner dismisses it.
 */
export function KeepBuildingCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const orgId = useOrgId();
  const role = useAuthStore((s) => s.user?.role);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(NUDGE_DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const q = useGetOnboarding(orgId ?? "", { query: { enabled: !!orgId && role === "org_admin" && !dismissed } });
  const steps = q.data?.steps ?? [];
  const total = steps.length;
  const done = steps.filter((s) => s.done).length;

  if (dismissed || !q.data || total === 0 || done >= total) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(NUDGE_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <Card className="relative flex-row items-center gap-4 border-brand/20 bg-brand/5 p-4 shadow-sm">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {t("onboarding.nudge.title", { done, total, defaultValue: `Your café is open · ${done}/${total} set up` })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("onboarding.nudge.body", "Keep building — add recipes, your team and more to unlock cost insights.")}
        </p>
      </div>
      <Button size="sm" variant="brand" onClick={() => navigate({ to: "/onboarding" })}>
        {t("onboarding.nudge.cta", "Keep building")} <ArrowRight className="size-4 rtl:rotate-180" />
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("common.dismiss", "Dismiss")}
        className="absolute end-2 top-2 rounded-md p-1 text-muted-foreground/70 hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </Card>
  );
}
