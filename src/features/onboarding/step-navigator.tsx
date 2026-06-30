import { useTranslation } from "react-i18next";
import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/data/api/generated/models";
import { STAGES, STEPS, type StepKey } from "./config";

interface Props {
  byKey: Map<string, OnboardingStep>;
  activeKey: StepKey;
  onSelect: (key: StepKey) => void;
  canComplete: boolean;
}

export function StepNavigator({ byKey, activeKey, onSelect, canComplete }: Props) {
  const { t } = useTranslation();

  return (
    <nav aria-label={t("onboarding.navLabel", "Setup steps")} className="space-y-6">
      {STAGES.map((stage) => {
        const steps = STEPS.filter((s) => s.stageId === stage.id);
        return (
          <div key={stage.id}>
            <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(`onboarding.stages.${stage.id}`, stage.id)}
            </p>
            <ul className="space-y-1">
              {steps.map((step) => {
                const status = step.statusKey ? byKey.get(step.statusKey) : undefined;
                const done = step.key === "go_live" ? false : !!status?.done;
                const required = step.key === "go_live" ? false : !!status?.required;
                const active = step.key === activeKey;
                const locked = step.key === "go_live" && !canComplete;
                const Icon = step.icon;
                const count = status?.count ?? 0;

                return (
                  <li key={step.key}>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => onSelect(step.key)}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-start transition-colors",
                        active ? "bg-muted" : "hover:bg-muted/60",
                        locked && "cursor-not-allowed opacity-50 hover:bg-transparent",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-full text-xs transition-colors",
                          done
                            ? "bg-success/15 text-success"
                            : active
                              ? "border-[1.5px] border-brand bg-brand/10 text-brand"
                              : locked
                                ? "bg-secondary text-muted-foreground"
                                : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-4" /> : locked ? <Lock className="size-3.5" /> : <Icon className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("flex items-center gap-2 text-sm", active || done ? "font-medium text-foreground" : "text-muted-foreground")}>
                          <span className="truncate">{t(`onboarding.steps.${step.key}.title`, step.key)}</span>
                          {!required && step.key !== "go_live" ? (
                            <span className="rounded bg-secondary px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {t("onboarding.optional", "Optional")}
                            </span>
                          ) : null}
                        </span>
                        {count > 0 && !done ? (
                          <span className="text-xs text-muted-foreground">{t("onboarding.countAdded", { count, defaultValue: `${count} added` })}</span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
