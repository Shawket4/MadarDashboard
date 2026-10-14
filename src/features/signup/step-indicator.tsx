import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export const SIGNUP_STEPS = ["phone", "code", "details"] as const;
export type SignupStep = (typeof SIGNUP_STEPS)[number];

/** Phone · Code · Your shop: where the person is, what is done, what is left. */
export function StepIndicator({ step }: { step: SignupStep }) {
  const { t } = useTranslation();
  const at = SIGNUP_STEPS.indexOf(step);
  const labels: Record<SignupStep, string> = {
    phone: t("signup.stepPhone", "Phone"),
    code: t("signup.stepCode", "Code"),
    details: t("signup.stepShop", "Your shop"),
  };
  return (
    <ol aria-label={t("signup.stepsLabel", "Sign-up progress")} className="flex items-center">
      {SIGNUP_STEPS.map((s, i) => {
        const done = i < at;
        const current = i === at;
        return (
          <li
            key={s}
            aria-current={current ? "step" : undefined}
            className={cn("flex items-center", i < SIGNUP_STEPS.length - 1 && "flex-1")}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums transition-colors motion-reduce:transition-none",
                  done && "border-brand bg-brand text-brand-foreground",
                  current && "border-brand bg-brand/10 text-brand ring-4 ring-brand/10",
                  !done && !current && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("text-sm", current ? "font-semibold text-foreground" : done ? "font-medium text-foreground" : "text-muted-foreground")}>
                {labels[s]}
                <span className="sr-only">
                  {" "}
                  {done ? t("signup.stepDone", "(done)") : current ? t("signup.stepCurrent", "(current step)") : ""}
                </span>
              </span>
            </span>
            {i < SIGNUP_STEPS.length - 1 ? (
              <span aria-hidden className={cn("mx-3 h-px min-w-3 flex-1 transition-colors motion-reduce:transition-none", done ? "bg-brand" : "bg-border")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
