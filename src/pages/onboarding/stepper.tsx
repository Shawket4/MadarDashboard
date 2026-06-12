import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { OnboardingStatus } from "@/shared/api/generated/models";
import { WIZARD_STEPS, isWizardStepDone } from "./use-onboarding";

/**
 * Horizontal step indicator. Connector lines are plain flex children, so the
 * whole strip mirrors automatically under dir="rtl" — no logical-property
 * tricks needed.
 */
export function Stepper({
  current,
  status,
  onNavigate,
}: {
  current: number;
  status: OnboardingStatus | undefined;
  onNavigate: (index: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <nav aria-label={t("onboarding.title")} className="w-full overflow-x-auto">
      <ol className="flex items-center min-w-max px-2">
        {WIZARD_STEPS.map((step, i) => {
          const done = isWizardStepDone(status, step.index);
          const active = current === step.index;
          // Free navigation backwards; forward only into visited/completed ground
          const reachable = step.index <= current || done;
          return (
            <li key={step.index} className="flex items-center">
              {i > 0 && (
                <span
                  className={cn(
                    "h-px w-6 sm:w-10 mx-1",
                    step.index <= current ? "bg-primary" : "bg-border",
                  )}
                />
              )}
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onNavigate(step.index)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-2 py-1 transition-colors",
                  reachable ? "cursor-pointer hover:bg-muted" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border text-xs font-semibold shrink-0",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : done
                        ? "bg-success/15 text-success border-success/40"
                        : "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {done && !active ? <Check size={13} /> : step.index + 1}
                </span>
                <span
                  className={cn(
                    "text-xs whitespace-nowrap hidden md:inline",
                    active ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t(step.titleKey)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
