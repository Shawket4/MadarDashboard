/**
 * Set-up (Dawam SA-4): the owner's checklist after an org is created —
 * branches pinned on the map with a radius, employees, shifts, rules. Each
 * step's tick comes from the data itself, and each step opens the screen that
 * already does the job rather than a second copy of it.
 */
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, FileSpreadsheet, MapPin, UserRoundPlus } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { Restricted } from "@/components/app/restricted";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { cn } from "@/lib/utils";
import { AddEmployeeDialog, ImportPeopleDialog } from "./add-employees";
import { DAWAM_KEY_PREFIX } from "./live";
import { DawamRefreshButton } from "./refresh-button";
import { branchPinned, setupProgress, SETUP_STEPS, useSetupData, type SetupStep } from "./setup";

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

  if (authz.ready && !canSetUp) {
    return <Restricted title={t("dawam.setup", "Set-up")} who={t("dawam.setupNoAccess", "Set-up is for whoever sets the rules (the owner, unless they gave it to someone).")} />;
  }

  const unpinned = (data.branches ?? []).filter((b) => !branchPinned(b));
  const body: Record<SetupStep, { title: string; hint: string; action: ReactNode }> = {
    branches: {
      title: t("dawam.setupBranches", "Pin your branches on the map"),
      hint: t("dawam.setupBranchesHint", "Each branch needs its place and a radius, so a clock-in can be checked against it."),
      action: (data.branches ?? []).length === 0 ? (
        <Button asChild variant="outline" size="sm"><Link to="/branches" search={{ edit: "new" }}>{t("dawam.setupAddBranch", "Add a branch")}</Link></Button>
      ) : (
        <div className="flex flex-wrap gap-2">
          {unpinned.map((b) => (
            <Button key={b.id} asChild variant="outline" size="sm">
              <Link to="/branches" search={{ edit: b.id }}><MapPin className="size-4" />{t("dawam.setupPin", { name: b.name, defaultValue: `Pin ${b.name}` })}</Link>
            </Button>
          ))}
        </div>
      ),
    },
    employees: {
      title: t("dawam.setupEmployees", "Add your employees"),
      hint: t("dawam.setupEmployeesHint", "One at a time, or a spreadsheet of names, WhatsApp numbers, branches and salaries."),
      action: (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setAdding("one")}><UserRoundPlus className="size-4" />{t("dawam.addEmployee", "Add employee")}</Button>
          <Button variant="outline" size="sm" onClick={() => setAdding("sheet")}><FileSpreadsheet className="size-4" />{t("dawam.importTitle", "Import from a spreadsheet")}</Button>
        </div>
      ),
    },
    shifts: {
      title: t("dawam.setupShifts", "Set up your shifts"),
      hint: t("dawam.setupShiftsHint", "The shifts people work, with their times and grace minutes."),
      action: <Button asChild variant="outline" size="sm"><Link to="/staff/shifts">{t("dawam.setupOpenShifts", "Open work shifts")}</Link></Button>,
    },
    rules: {
      title: t("dawam.setupRules", "Save your rules"),
      hint: t("dawam.setupRulesHint", "Lateness, overtime, pay day and labour limits. Nobody can clock in until they're saved."),
      action: <Button asChild variant="outline" size="sm"><Link to="/staff/rules">{t("dawam.rulesFirstAction", "Set the rules")}</Link></Button>,
    },
  };

  return (
    <Page width="reading">
      <PageHeader
        title={t("dawam.setup", "Set-up")}
        description={
          p.ready
            ? t("dawam.setupProgress", { n: p.count, total: SETUP_STEPS.length, defaultValue: `${p.count} of ${SETUP_STEPS.length} done` })
            : t("dawam.setupSubtitle", "Four steps before your team can clock in.")
        }
        actions={<DawamRefreshButton prefixes={SETUP_KEYS} />}
      />
      {!p.ready ? <Skeleton className="h-72 w-full rounded-2xl" /> : (
        <div className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={p.count}>
            <div className="h-full bg-primary transition-[width]" style={{ width: `${(p.count / SETUP_STEPS.length) * 100}%` }} />
          </div>
          {p.complete ? (
            <p role="status" className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm font-medium">
              {t("dawam.setupComplete", "All set: your team can clock in.")}
            </p>
          ) : null}
          {SETUP_STEPS.map((s, i) => {
            const done = p.done[s];
            return (
              <Card key={s} data-testid={`step-${s}`} data-done={done}>
                <CardHeader className="flex flex-row items-start gap-3">
                  {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}
                  <div className="space-y-1.5">
                    <CardTitle className={cn(done && "text-muted-foreground")}>{`${i + 1}. ${body[s].title}`}</CardTitle>
                    <CardDescription>{done ? t("dawam.setupDone", "Done") : body[s].hint}</CardDescription>
                  </div>
                </CardHeader>
                {done ? null : <CardContent>{body[s].action}</CardContent>}
              </Card>
            );
          })}
        </div>
      )}
      {adding === "one" ? <AddEmployeeDialog onOpenChange={(o) => !o && setAdding(null)} /> : null}
      {adding === "sheet" ? <ImportPeopleDialog onOpenChange={(o) => !o && setAdding(null)} /> : null}
    </Page>
  );
}
