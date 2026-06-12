import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";
import type { OnboardingStatus } from "@/shared/api/generated/models";
import { StepFrame } from "./step-frame";
import { CoverageRing } from "./coverage-ring";
import { WIZARD_STEPS } from "./use-onboarding";

const CONFETTI_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

/** Lightweight CSS confetti — no new dependencies. */
function ConfettiBurst() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: 36 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-2 h-2 rounded-sm animate-confetti-fall"
          style={{
            left: `${(i * 137) % 100}%`,
            top: "-2%",
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 12) * 0.08}s`,
            animationDuration: `${1.4 + (i % 5) * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Maps a backend step key to the wizard page that owns it. */
const stepIndexForKey = (key: string): number | null => {
  const page = WIZARD_STEPS.find((p) => (p.keys as readonly string[]).includes(key));
  return page ? page.index : null;
};

export function StepReview({
  status,
  onFinish,
  finishPending,
  onNavigate,
}: {
  status: OnboardingStatus | undefined;
  onFinish: () => void;
  finishPending: boolean;
  onNavigate: (index: number) => void;
}) {
  const { t } = useTranslation();
  const [celebrating, setCelebrating] = useState(false);

  const steps = status?.steps ?? [];
  const missingRequired = steps.filter((s) => s.required && !s.done);
  const canComplete = !!status?.can_complete;

  return (
    <StepFrame title={t("onboarding.review.title")} description={t("onboarding.review.description")}>
      {celebrating && <ConfettiBurst />}
      <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
        <Card>
          <CardContent className="p-4 space-y-1">
            {steps.map((s) => {
              const target = stepIndexForKey(s.key);
              return (
                <div key={s.key} className="flex items-center justify-between gap-3 py-1.5">
                  <div className="flex items-center gap-2 text-sm">
                    {s.done ? (
                      <CheckCircle2 size={16} className="text-success shrink-0" />
                    ) : (
                      <Circle size={16} className="text-muted-foreground/50 shrink-0" />
                    )}
                    <span className={cn(!s.done && !s.required && "text-muted-foreground")}>
                      {t(`onboarding.stepKeys.${s.key}`, { defaultValue: s.key })}
                      {s.count > 0 && <span className="text-xs text-muted-foreground ms-1">({s.count})</span>}
                    </span>
                  </div>
                  {!s.done && (
                    s.required ? (
                      target !== null ? (
                        <Button size="sm" variant="outline" onClick={() => onNavigate(target)}>
                          {t("onboarding.review.fix")}
                        </Button>
                      ) : <Badge variant="warning">{t("onboarding.review.required")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("onboarding.review.later")}</Badge>
                    )
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <CoverageRing ratio={status?.recipe_coverage ?? 0} label={t("onboarding.costs.coverageLabel")} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 space-y-2">
        {!canComplete && missingRequired.length > 0 && (
          <p className="text-sm text-warning">
            {t("onboarding.review.finishRequires", {
              steps: missingRequired
                .map((s) => t(`onboarding.stepKeys.${s.key}`, { defaultValue: s.key }))
                .join(" · "),
            })}
          </p>
        )}
        <Button
          size="lg"
          disabled={!canComplete || finishPending}
          loading={finishPending}
          className="gap-2"
          onClick={() => {
            setCelebrating(true);
            onFinish();
          }}
        >
          <PartyPopper size={16} />
          {t("onboarding.review.finish")}
        </Button>
      </div>
    </StepFrame>
  );
}
