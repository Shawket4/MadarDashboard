/**
 * Set-up (Dawam SA-4): the owner's four steps after a business is created —
 * where each branch is, who works there, their shifts, and the rules they are
 * paid by. A guided flow, one decision per screen: it opens on the first step
 * that isn't done, each step's tick comes from the data itself (never a box
 * someone ticks), any step can be opened at any time, and every step does its
 * job right here with the same calls its full page makes.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { Restricted } from "@/components/app/restricted";
import { ErrorState } from "@/components/app/empty-state";
import { getErrorMessage } from "@/data/api/errors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { cn } from "@/lib/utils";
import type { AttendanceSettings, Employee, WorkShift } from "@/data/api/generated/models";
import { WorkShiftDialog } from "@/features/staff/work-shift-dialog";
import { AddEmployeeDialog, ImportPeopleDialog } from "./add-employees";
import { DAWAM_KEY_PREFIX } from "./live";
import { DawamRefreshButton } from "./refresh-button";
import { setupProgress, SETUP_STEPS, useSetupData, type SetupStep } from "./setup";
import { BranchesStep, EmployeesStep, RulesStep, ShiftsStep } from "./setup-steps";

/** The checklist reads the branches (step 1: pinned on the map) besides Dawam's own. */
const SETUP_KEYS = [DAWAM_KEY_PREFIX, "/branches"];

export function SetupPage() {
  const { t } = useTranslation();
  const authz = useAuthz();
  // A capability, not the owner role (DSH-6, PM-4): whoever sets the rules.
  const canSetUp = authz.can(Cap.hrRulesEdit);
  const data = useSetupData(canSetUp, true);
  const p = setupProgress(data);
  const [adding, setAdding] = useState<"one" | "sheet" | null>(null);
  const [newShift, setNewShift] = useState(false);
  const [step, setStep] = useState<SetupStep | null>(null);

  // Open on the first step that isn't done, once the answers are in.
  useEffect(() => {
    if (p.ready && step === null) setStep(SETUP_STEPS.find((s) => !p.done[s]) ?? "rules");
  }, [p.ready, step, p.done]);

  if (authz.ready && !canSetUp) {
    return <Restricted title={t("dawam.setup", "Set-up")} who={t("dawam.setupNoAccess", "Set-up is for whoever sets the rules (the owner, unless they gave it to someone).")} />;
  }

  const meta: Record<SetupStep, { title: string; short: string; hint: string }> = {
    branches: {
      short: t("dawam.stepBranches", "Branches"),
      title: t("dawam.setupBranchesV2", "Where is each branch?"),
      hint: t("dawam.setupBranchesHintV2", "A clock-in is checked against the branch's pin and the distance around it, so pin each branch where the shop is."),
    },
    employees: {
      short: t("dawam.stepEmployees", "People"),
      title: t("dawam.setupEmployeesV2", "Who works here?"),
      hint: t("dawam.setupEmployeesHint", "One at a time, or a spreadsheet of names, WhatsApp numbers, branches and salaries."),
    },
    shifts: {
      short: t("dawam.stepShifts", "Shifts"),
      title: t("dawam.setupShiftsV2", "When do they work?"),
      hint: t("dawam.setupShiftsHintV2", "The shifts you roster people on, with their times and grace. A shift that ends after midnight is fine."),
    },
    rules: {
      short: t("dawam.stepRules", "Rules"),
      title: t("dawam.setupRulesV2", "What does lateness cost?"),
      hint: t("dawam.setupRulesHint", "Lateness, overtime, pay day and labour limits. Nobody can clock in until they're saved."),
    },
  };

  const branches = data.branches ?? [];
  const branchName = (id: string | null | undefined) =>
    id ? (branches.find((b) => b.id === id)?.name ?? "") : t("staff.wholeBusiness", "Every branch");
  const i = step ? SETUP_STEPS.indexOf(step) : 0;
  const prev = i > 0 ? SETUP_STEPS[i - 1] : null;
  const next = i < SETUP_STEPS.length - 1 ? SETUP_STEPS[i + 1] : null;

  return (
    <Page width="reading">
      <PageHeader
        title={t("dawam.setupTitle", "Set up Dawam")}
        description={
          p.ready
            ? t("dawam.setupProgress", { n: p.count, total: SETUP_STEPS.length, defaultValue: `${p.count} of ${SETUP_STEPS.length} done` })
            : t("dawam.setupSubtitle", "Four steps before your team can clock in.")
        }
        actions={<DawamRefreshButton prefixes={SETUP_KEYS} />}
      />
      {!p.ready && data.error ? (
        <ErrorState
          title={t("dawam.setupLoadError", "Couldn't load the set-up checklist")}
          message={getErrorMessage(data.error)}
          onRetry={data.retry}
        />
      ) : !p.ready || !step ? (
        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-4">
          <nav aria-label={t("dawam.setupSteps", "Set-up steps")}>
            <ol className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {SETUP_STEPS.map((s, n) => {
                const done = p.done[s];
                const current = s === step;
                return (
                  <li key={s} data-testid={`step-${s}`} data-done={done}>
                    <button
                      type="button"
                      aria-current={current ? "step" : undefined}
                      onClick={() => setStep(s)}
                      className={cn(
                        "flex h-full w-full flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-start transition-colors motion-reduce:transition-none sm:flex-row sm:items-center sm:gap-2 sm:px-3",
                        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        current ? "border-primary bg-card shadow-sm" : "bg-transparent hover:bg-accent",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
                          done ? "bg-success text-success-foreground" : current ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-3.5" /> : n + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block truncate text-sm", current ? "font-semibold" : "font-medium")}>{meta[s].short}</span>
                        <span className="block text-xs text-muted-foreground">
                          {done ? t("dawam.setupDone", "Done") : t("dawam.setupToDo", "To do")}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {p.complete ? (
            <div role="status" className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/10 p-4">
              <PartyPopper aria-hidden className="mt-0.5 size-5 shrink-0 text-[color-mix(in_oklab,var(--color-success)_60%,var(--color-foreground))]" />
              <div className="space-y-2">
                <p className="text-sm font-medium">{t("dawam.setupComplete", "All set: your team can clock in.")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm"><Link to="/staff/schedule">{t("dawam.setupGoSchedule", "Make this week's schedule")}</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link to="/staff/team">{t("dawam.setupGoTeam", "See who's in")}</Link></Button>
                </div>
              </div>
            </div>
          ) : null}

          <section aria-labelledby="setup-step-title" className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
            <header className="mb-5 space-y-1">
              <p className="text-xs font-medium text-muted-foreground tabular-nums">
                {t("dawam.setupStepOf", { n: i + 1, total: SETUP_STEPS.length, defaultValue: `Step ${i + 1} of ${SETUP_STEPS.length}` })}
              </p>
              <h2 id="setup-step-title" className="text-lg font-semibold text-balance">{meta[step].title}</h2>
              <p className="max-w-prose text-sm text-muted-foreground">{meta[step].hint}</p>
            </header>

            {step === "branches" ? (
              <BranchesStep branches={branches} canEdit={authz.can(Cap.branchesEdit)} />
            ) : step === "employees" ? (
              <EmployeesStep
                employees={(data.employees ?? []) as Pick<Employee, "id" | "name" | "employment_status" | "salary_set">[]}
                canCreate={authz.can(Cap.hrStaffCreate)}
                onAdd={setAdding}
              />
            ) : step === "shifts" ? (
              <ShiftsStep
                shifts={(data.shifts ?? []) as WorkShift[]}
                branchName={branchName}
                canCreate={authz.can(Cap.hrScheduleCreate)}
                onNew={() => setNewShift(true)}
              />
            ) : (
              <RulesStep settings={data.settings as AttendanceSettings} canGender={authz.can(Cap.hrRosterSettings)} />
            )}

            <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              {prev ? (
                <Button variant="ghost" onClick={() => setStep(prev)}>
                  <ArrowLeft className="size-4 rtl:rotate-180" />
                  {meta[prev].short}
                </Button>
              ) : <span />}
              {next ? (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {!p.done[step] ? (
                    <span className="text-xs text-muted-foreground">{t("dawam.setupComeBack", "You can come back to this.")}</span>
                  ) : null}
                  <Button variant={p.done[step] ? "default" : "outline"} onClick={() => setStep(next)}>
                    {t("dawam.setupNext", { step: meta[next].short, defaultValue: `Next: ${meta[next].short}` })}
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </Button>
                </div>
              ) : null}
            </footer>
          </section>
        </div>
      )}
      {adding === "one" ? <AddEmployeeDialog onOpenChange={(o) => !o && setAdding(null)} /> : null}
      {adding === "sheet" ? <ImportPeopleDialog onOpenChange={(o) => !o && setAdding(null)} /> : null}
      <WorkShiftDialog
        shift={null}
        open={newShift}
        onOpenChange={setNewShift}
        branches={branches.map((b) => ({ id: b.id, name: b.name }))}
        wholeBusiness={authz.canEverywhere(Cap.hrScheduleCreate)}
      />
    </Page>
  );
}
