import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CalendarRange } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Restricted } from "@/components/app/restricted";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useScope } from "@/data/scope/use-scope";
import { useDisciplineReport } from "@/data/api/generated/api";
import type { DisciplineRow } from "@/data/api/generated/models";
import { cairoParts, fmtNumber } from "@/lib/format";

const PRESET_FALLBACK: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  mtd: "Month to date",
  custom: "Custom range",
};

/** ISO instant → the local "YYYY-MM-DD" the backend's NaiveDate params want,
 * in the active branch/org timezone (not a raw slice of the UTC string,
 * which would land on the wrong calendar day whenever the zone offset from
 * UTC isn't a whole day boundary). */
function localDate(iso: string): string {
  const { y, m, d } = cairoParts(iso);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const UNASSIGNED_KEY = "__unassigned__";

function groupByDepartment(rows: DisciplineRow[]): { key: string; name: string; rows: DisciplineRow[] }[] {
  const order: string[] = [];
  const groups = new Map<string, { name: string; rows: DisciplineRow[] }>();
  for (const r of rows) {
    const key = r.department_id ?? UNASSIGNED_KEY;
    if (!groups.has(key)) {
      order.push(key);
      groups.set(key, { name: r.department_name ?? "", rows: [] });
    }
    groups.get(key)!.rows.push(r);
  }
  return order.map((key) => ({ key, ...groups.get(key)! }));
}

/** Staff ranked within their department by attendance reliability (fewest
 * absences, then fewest lates, then least late time) — built entirely from
 * the attendance ledger already kept for payroll; there's no separate
 * write-up/incident system behind it. */
export function StaffDisciplinePage() {
  const { t } = useTranslation();
  const { branchId, from, to, preset } = useScope();
  const periodLabel = t(`scope.preset.${preset ?? "30d"}`, PRESET_FALLBACK[preset ?? "30d"] ?? "");

  // hr.attendance.read; the server ranks only the branches the person works at.
  const authz = useAuthz();
  const canSee = authz.can(Cap.hrAttendanceRead);
  const q = useDisciplineReport(
    { from: localDate(from), to: localDate(to), branch_id: branchId ?? undefined },
    { query: { enabled: canSee } },
  );

  const groups = useMemo(() => groupByDepartment(q.data?.rows ?? []), [q.data]);

  if (authz.ready && !canSee) {
    return <Restricted title={t("reports.staff.title", "Staff discipline")} who={t("reports.noAccess", "Your account can't open this report. The owner can give you access.")} />;
  }

  return (
    <Page>
      <PageHeader
        title={t("reports.staff.title", "Staff discipline")}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange aria-hidden className="size-3.5" />
            {periodLabel}
          </span>
        }
      />

      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState title={t("reports.staff.empty", "No attendance recorded in this period")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.key} className="py-0">
              <CardHeader className="pt-4">
                <CardTitle className="text-base">
                  {g.key === UNASSIGNED_KEY ? t("reports.staff.unassigned", "Unassigned") : g.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <ul className="divide-y text-sm">
                  {g.rows.map((r) => (
                    <li key={r.employee_id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Badge variant="outline" className="shrink-0 font-mono tabular-nums">
                          #{r.rank_in_department}
                        </Badge>
                        <span className="truncate font-medium">{r.employee_name}</span>
                      </div>
                      <span className="flex shrink-0 flex-col items-end text-end text-xs text-muted-foreground">
                        <span>
                          {t("reports.staff.rowSummary", {
                            defaultValue: "{{late}} late · {{absent}} absent · {{minutes}}m",
                            late: fmtNumber(r.late_days),
                            absent: fmtNumber(r.absent_days),
                            minutes: fmtNumber(r.total_late_minutes),
                          })}
                        </span>
                        {/* A cover shows for both people (CV-7). */}
                        {(r.covers_given ?? 0) > 0 ? (
                          <span>{t("reports.staff.coversGiven", { count: r.covers_given, n: fmtNumber(r.covers_given) })}</span>
                        ) : null}
                        {(r.covered_by_others ?? 0) > 0 ? (
                          <span>{t("reports.staff.coveredByOthers", { count: r.covered_by_others, n: fmtNumber(r.covered_by_others) })}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
