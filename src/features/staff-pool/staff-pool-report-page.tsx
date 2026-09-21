/**
 * What a branch gave away as staff drinks on one business day.
 *
 * The pool is a per-branch, per-DAY thing — it resets at the branch's own local
 * midnight, not at UTC — so this report is a day at a branch, not a range
 * rolled up. The scope bar's period still drives it: the day shown is the LAST
 * day of the selected period, which makes "Today" the obvious default and a
 * custom range a way of looking back at one day without a second date picker
 * on the page.
 *
 * "Over allowance" is deliberately the loudest figure when it is not zero.
 * Going over is allowed by design — a till that refuses a manager a coffee gets
 * worked around, and a worked-around till records nothing — so the only control
 * on it is that somebody sees it afterwards. That is this number's whole job.
 */
import { useTranslation } from "react-i18next";
import { CalendarRange, CupSoda } from "lucide-react";

import { Page, PageHeader } from "@/components/app/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/app/stat-card";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Restricted } from "@/components/app/restricted";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";
import { useScope } from "@/data/scope/use-scope";
import { useGetStaffPoolToday, useListStaffDrinks } from "@/data/api/generated/api";
import { cairoParts, fmtDate } from "@/lib/format";

import { StaffDrinksTable } from "./staff-drinks-table";

/**
 * ISO instant → the local "YYYY-MM-DD" the backend's business-date param wants,
 * in the active branch/org timezone. Slicing the UTC string instead lands on
 * the wrong calendar day for every evening in a zone ahead of UTC — which for
 * a pool that resets at local midnight is the difference between yesterday's
 * overspend and today's.
 */
function localDate(iso: string): string {
  const { y, m, d } = cairoParts(iso);
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function StaffPoolReportPage() {
  const { t } = useTranslation();
  const { branchId, from, to } = useScope();

  const authz = useAuthz();
  const canSee = authz.can(Cap.ordersStaffDrinkRecord);
  // The scope bar's period, as branch-local business days. The summary is a
  // DAY — the pool resets every midnight, so there is no such thing as a
  // 30-day allowance — and it reports the last day of the period. The list
  // below it covers the whole period, which is how you find last Tuesday's
  // overspend without moving the date picker twice.
  const fromDate = from ? localDate(from) : "";
  const businessDate = to ? localDate(to) : "";
  const oneDay = fromDate === businessDate;

  const q = useGetStaffPoolToday(
    { branch_id: branchId ?? "", business_date: businessDate || undefined },
    // A branch is required: the pool belongs to one shop's day, and there is no
    // honest way to roll "All branches" into a single allowance.
    { query: { enabled: canSee && !!branchId && !!businessDate } },
  );

  const drinks = useListStaffDrinks(
    { branch_id: branchId ?? "", from: fromDate || undefined, to: businessDate || undefined },
    // Same gate as the summary, for the same reason: a person without the
    // capability must not send a request that can only come back 403.
    { query: { enabled: canSee && !!branchId && !!fromDate && !!businessDate } },
  );

  const title = t("staffPool.reportTitle", "Staff drinks");

  if (authz.ready && !canSee) {
    return (
      <Restricted
        title={title}
        who={t("reports.noAccess", "Your account can't open this report. The owner can give you access.")}
      />
    );
  }

  const today = q.data;
  const over = today?.over ?? 0;

  return (
    <Page>
      <PageHeader
        title={title}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange aria-hidden className="size-3.5" />
            {businessDate ? fmtDate(to) : null}
          </span>
        }
      />

      {!branchId ? (
        <EmptyState
          icon={CupSoda}
          title={t("staffPool.pickBranch", "Choose a branch")}
          description={t(
            "staffPool.pickBranchBody",
            "The staff drinks pool belongs to one branch's day, so there is no all-branches total to show.",
          )}
        />
      ) : q.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : q.isError ? (
        <ErrorState onRetry={() => void q.refetch()} />
      ) : today && !today.enabled ? (
        <EmptyState
          icon={CupSoda}
          title={t("staffPool.reportOff", "Staff drinks are off at this branch")}
          description={t(
            "staffPool.reportOffBody",
            "Nobody can ring one up here. Turn the pool on, and choose the items that count, under Settings.",
          )}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("staffPool.poolOn", {
              defaultValue: "The pool on {{date}}",
              date: fmtDate(to),
            })}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("staffPool.statAllowance", "Allowance")}
              value={today?.allowance ?? 0}
              icon={CupSoda}
            />
            <StatCard label={t("staffPool.statUsed", "Given out")} value={today?.used ?? 0} />
            <StatCard
              label={t("staffPool.statRemaining", "Left")}
              value={today?.remaining ?? 0}
              accent={(today?.remaining ?? 0) > 0 ? "success" : "neutral"}
            />
            <StatCard
              label={t("staffPool.statOver", "Over allowance")}
              value={over}
              // Loud only when there is something to be loud about: a
              // permanently red zero teaches people to stop reading it.
              accent={over > 0 ? "destructive" : "neutral"}
              className={over > 0 ? "ring-2 ring-destructive/40" : undefined}
              hint={
                over > 0
                  ? t(
                      "staffPool.statOverHint",
                      "Allowed, and recorded. The notes below say who each one was for.",
                    )
                  : undefined
              }
            />
          </div>

          <Card className="py-0">
            <CardHeader className="pt-4">
              <CardTitle className="text-base">
                {t("staffPool.drinksTitle", "Every drink, and its note")}
              </CardTitle>
              <CardDescription>
                {oneDay
                  ? fmtDate(to)
                  : t("staffPool.drinksRange", {
                      defaultValue: "{{from}} to {{to}}",
                      from: fmtDate(from),
                      to: fmtDate(to),
                    })}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <StaffDrinksTable
                drinks={drinks.data ?? []}
                loading={drinks.isLoading}
                error={drinks.isError ? drinks.error : undefined}
                onRetry={() => void drinks.refetch()}
                showDate={!oneDay}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </Page>
  );
}
