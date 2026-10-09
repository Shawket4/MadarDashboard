/**
 * Where this month's payroll stands, as the three steps it always goes
 * through (estimate → approved → paid), and the one thing to do next. The
 * page used to say only a status word in the corner; a manager had to know
 * the order of things.
 */
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type PayPhase = "open" | "approved" | "paid";

const ORDER: PayPhase[] = ["open", "approved", "paid"];

/** The sentence under the steps: what to do now. */
export function nextStepKey(phase: PayPhase, blockers: number, paid: number, people: number): [string, string] {
  if (phase === "open") {
    return blockers > 0
      ? ["dawamOps.payNextBlocked", "Fix what is listed below, then approve."]
      : ["dawamOps.payNextApprove", "Check the payslips, then approve: they freeze and each person sees theirs."];
  }
  if (phase === "approved") {
    return paid === 0
      ? ["dawamOps.payNextPayFirst", "Mark each person paid as you hand over their pay. Until the first one, you can still reopen."]
      : paid < people
        ? ["dawamOps.payNextPayRest", "Mark the rest paid as you hand over their pay."]
        : ["dawamOps.payNextDone", "Everyone is paid."];
  }
  return ["dawamOps.payNextClosed", "Everyone is paid. This month is closed."];
}

export function PayrollSteps({
  phase, blockers, paid, people,
}: {
  phase: PayPhase;
  /** Things that stop approval (a salary not set). */
  blockers: number;
  paid: number;
  people: number;
}) {
  const { t } = useTranslation();
  const at = ORDER.indexOf(phase);
  const label: Record<PayPhase, string> = {
    open: t("dawamOps.stepEstimate", "Estimate"),
    approved: t("dawamOps.stepApproved", "Approved"),
    paid: t("dawamOps.stepPaid", "Paid"),
  };
  const sub: Record<PayPhase, string> = {
    open: t("dawamOps.stepEstimateSub", "Live, changes with every punch"),
    approved: t("dawamOps.stepApprovedSub", "Payslips frozen"),
    paid: phase === "open"
      ? t("dawamOps.stepPaidSub", "Each person marked paid")
      : t("dawamOps.paidOf", { paid, people, defaultValue: "{{paid}} of {{people}} marked paid" }),
  };
  const [key, fallback] = nextStepKey(phase, blockers, paid, people);
  return (
    <section aria-label={t("dawamOps.payrollSteps", "Payroll steps")} className="space-y-3 rounded-2xl border bg-card px-4 py-3 sm:px-5">
      <ol className="grid grid-cols-3 gap-2">
        {ORDER.map((p, i) => {
          const done = i < at || (p === "paid" && phase === "paid");
          const current = i === at && phase !== "paid";
          return (
            <li key={p} aria-current={current ? "step" : undefined} className="flex min-w-0 items-start gap-2">
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums",
                  done && "border-transparent bg-[color-mix(in_oklab,var(--color-success)_70%,var(--color-foreground))] text-background",
                  current && "border-primary bg-primary text-primary-foreground",
                  !done && !current && "text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-semibold", !done && !current && "text-muted-foreground")}>{label[p]}</span>
                <span className="block text-xs text-muted-foreground">{sub[p]}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="border-t pt-2.5 text-sm">
        <span className="font-medium">{t("dawamOps.nextLabel", "Next:")}</span> {t(key, fallback)}
      </p>
    </section>
  );
}
