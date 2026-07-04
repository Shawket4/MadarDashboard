import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { ChartCard } from "@/components/app/chart-card";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarginWatch } from "@/data/api/generated/api";
import type { MarginLedgerRow } from "@/data/api/generated/models";
import { useOrgId } from "@/hooks/use-org-id";
import { useScope } from "@/data/scope/use-scope";
import { fmtMoney, fmtNumber, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { signalReason } from "./signals";

/**
 * Dashboard "Margin watch" card: the period's gross margin with its trend, the
 * three best and three worst margin contributors (each with the first flag's
 * reason), and the open-signal / cost-unknown tallies. Footer deep-links to
 * the full profitability ledger.
 */
export function MarginWatchCard() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const { scopeBranchId, from, to } = useScope();

  const watch = useMarginWatch(
    scopeBranchId,
    { from: from ?? undefined, to: to ?? undefined },
    { query: { enabled: !!orgId } },
  );

  const data = watch.data;
  const totals = data?.totals;
  const marginDelta =
    totals && totals.prev_margin_known > 0
      ? (totals.margin_known - totals.prev_margin_known) / totals.prev_margin_known
      : null;

  const empty = !data || (data.top.length === 0 && data.bottom.length === 0 && totals?.revenue === 0);

  return (
    <ChartCard title={t("insights.watch.title", "Margin watch")} contentClassName="px-4 sm:px-6">
      {watch.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : watch.isError ? (
        <EmptyState icon={AlertCircle} title={t("common.somethingWrong", "Something went wrong")} className="border-0" />
      ) : empty ? (
        <EmptyState title={t("common.noResults", "No results found")} className="border-0" />
      ) : (
        <div className="space-y-4">
          {/* Headline: gross margin EGP + % with delta vs the previous period. */}
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-2xl font-semibold leading-none tracking-tight tabular">
              {fmtMoney(totals?.margin_known ?? 0)}
            </span>
            {totals?.margin_pct != null ? (
              <span className="tabular text-sm text-muted-foreground">{fmtPercent(totals.margin_pct / 100)}</span>
            ) : null}
            {marginDelta != null ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium tabular",
                  marginDelta >= 0 ? "text-success" : "text-destructive",
                )}
              >
                {marginDelta >= 0 ? (
                  <ArrowUpRight aria-hidden className="size-3" />
                ) : (
                  <ArrowDownRight aria-hidden className="size-3" />
                )}
                {fmtPercent(Math.abs(marginDelta))}
                <span className="sr-only">{t("insights.watch.vsPrev", "vs previous period")}</span>
              </span>
            ) : null}
          </div>

          {(data.open_signals > 0 || data.rows_cost_unknown > 0) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {data.open_signals > 0 ? (
                <span>
                  {t("insights.watch.openSignals", {
                    count: data.open_signals,
                    defaultValue: "{{count}} open signals",
                  })}
                </span>
              ) : null}
              {data.rows_cost_unknown > 0 ? (
                <span>
                  {t("insights.watch.costUnknown", {
                    count: data.rows_cost_unknown,
                    defaultValue: "{{count}} items missing cost",
                  })}
                </span>
              ) : null}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <WatchList
              title={t("insights.watch.top", "Top earners")}
              rows={data.top}
              tone="success"
            />
            <WatchList
              title={t("insights.watch.bottom", "Needs attention")}
              rows={data.bottom}
              tone="warning"
            />
          </div>

          <div className="border-t pt-3">
            <Link
              to="/insights/profitability"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {t("insights.watch.viewAll", "Menu profitability")}
              <ArrowRight aria-hidden className="size-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

function WatchList({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: MarginLedgerRow[];
  tone: "success" | "warning";
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("common.noResults", "No results found")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={`${r.menu_item_id}-${r.size_label}`} className="flex items-start gap-2 text-sm">
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full",
                  tone === "success" ? "bg-success" : "bg-warning",
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">
                    {r.item_name}
                    {r.size_label !== "one_size" ? (
                      <span className="text-muted-foreground"> · {r.size_label}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular">{fmtMoney(r.margin)}</span>
                </div>
                {r.flags[0] ? (
                  <p className="truncate text-xs text-muted-foreground">{signalReason(t, r.flags[0])}</p>
                ) : r.quantity_sold > 0 ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {t("insights.watch.sold", { count: r.quantity_sold, defaultValue: "{{count}} sold" })}
                    {r.margin_pct != null ? ` · ${fmtNumber(r.margin_pct, { maximumFractionDigits: 1 })}%` : ""}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
