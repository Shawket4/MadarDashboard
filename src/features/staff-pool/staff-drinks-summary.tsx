/**
 * What the period's staff drinks came to, in one line of figures above the rows.
 *
 * Deliberately NOT a second row of stat cards. The four cards above it are the
 * day's allowance — the thing a manager checks; these are the period's money —
 * the thing an owner reads. Two identical card grids would say they are the
 * same kind of fact. A ruled strip of figures reads as the table's own totals,
 * which is what it is: the server sums exactly the rows listed under it.
 *
 * "Given free" is revenue the branch chose not to take; "Extras charged" is the
 * only part of these lines that IS revenue; "Cost" is what the drinks cost to
 * make, in full, because the drink was made whether or not anyone paid.
 */
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StaffDrinksSummary } from "@/data/api/generated/models";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const ATTENTION = "text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]";
const OVER = "text-[color-mix(in_oklab,var(--color-destructive)_60%,var(--color-foreground))]";

export function StaffDrinksSummaryStrip({
  summary,
  loading,
  failed,
  onRetry,
}: {
  summary: StaffDrinksSummary | undefined;
  loading?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}) {
  const { t } = useTranslation();

  if (loading) {
    return <Skeleton data-testid="staff-summary-loading" className="h-14 w-full" />;
  }
  if (failed || !summary) {
    // The rows below still load on their own; losing the totals must not take
    // the list with it, and must not read as "the totals are zero".
    return failed ? (
      <p role="alert" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {t("staffPool.summaryFailed", "Couldn't load the totals for this period.")}
        {onRetry ? (
          <Button variant="link" size="sm" className="h-auto p-0" onClick={onRetry}>
            {t("common.retry", "Retry")}
          </Button>
        ) : null}
      </p>
    ) : null;
  }
  // Nothing was rung: the table's own empty state says so once; a row of
  // zeroes above it would say it five more times.
  if (summary.drinks === 0) return null;

  return (
    <div className="space-y-2">
      <dl
        data-testid="staff-summary"
        aria-label={t("staffPool.summaryLabel", "Totals for this period")}
        className="flex flex-wrap gap-x-8 gap-y-3 border-y py-3"
      >
        <Figure label={t("staffPool.sumDrinks", "Drinks")} value={fmtNumber(summary.quantity)} />
        <Figure label={t("staffPool.sumComp", "Given free")} value={fmtMoney(summary.comp_minor)} />
        <Figure label={t("staffPool.sumExtras", "Extras charged")} value={fmtMoney(summary.extras_minor)} />
        <Figure label={t("staffPool.sumCost", "Cost to make")} value={fmtMoney(summary.cost_minor)} />
        <Figure
          label={t("staffPool.sumOver", "Over allowance")}
          value={fmtNumber(summary.overspent)}
          className={summary.overspent > 0 ? OVER : undefined}
        />
        {summary.comp_mismatches > 0 ? (
          <Figure
            label={t("staffPool.sumMismatches", "Till differs")}
            value={fmtNumber(summary.comp_mismatches)}
            className={ATTENTION}
          />
        ) : null}
      </dl>
      {summary.unpriced > 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("staffPool.sumUnpriced", {
            defaultValue:
              "{{count}} of these were rung before staff drinks were priced. They count as drinks, but have no figure in Given free or Extras charged.",
            count: summary.unpriced,
          })}
        </p>
      ) : null}
    </div>
  );
}

function Figure({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono text-base font-semibold tabular-nums", className)}>
        <bdi>{value}</bdi>
      </dd>
    </div>
  );
}
