import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight, TriangleAlert } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { repricing, useRepricing } from "@/data/api/generated/api";
import { fmtMoney, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TINT } from "./util";

type Suggestion = Awaited<ReturnType<typeof repricing>>["suggestions"][number];

/**
 * Repricing suggestions surface: underpriced items with a target-restoring
 * price, straight from the profitability engine (`GET /insights/…/repricing`).
 * Items without a complete recipe cost are never suggested — coverage is shown
 * so it's honest about what it can and can't price.
 */
export function RepricingTab({ scopeBranchId }: { scopeBranchId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const q = useRepricing(scopeBranchId);

  const columns = useMemo<ColumnDef<Suggestion>[]>(
    () => [
      {
        id: "item",
        header: t("insights.repricing.item", "Item"),
        meta: { label: t("insights.repricing.item", "Item"), phone: "title" },
        cell: ({ row: { original: s } }) => (
          <div className="flex items-center gap-1.5">
            {s.below_cost ? <TriangleAlert className={cn("size-3.5 shrink-0", TINT.danger)} aria-hidden="true" /> : null}
            <span className="font-medium">{s.item_name}</span>
            {s.size_label !== "one_size" ? <span className="text-xs text-muted-foreground">{s.size_label}</span> : null}
          </div>
        ),
      },
      { id: "current", header: t("insights.repricing.current", "Current"), meta: { label: t("insights.repricing.current", "Current"), numeric: true }, cell: ({ row }) => fmtMoney(row.original.current_price) },
      { id: "cost", header: t("insights.repricing.cost", "Cost"), meta: { label: t("insights.repricing.cost", "Cost"), numeric: true }, cell: ({ row }) => fmtMoney(row.original.cost) },
      {
        id: "margin",
        header: t("insights.repricing.marginCol", "Margin"),
        meta: { label: t("insights.repricing.marginCol", "Margin"), numeric: true },
        cell: ({ row }) => <span className={cn(row.original.below_cost && TINT.danger)}>{fmtPercent(row.original.margin_pct / 100)}</span>,
      },
      { id: "suggested", header: t("insights.repricing.suggested", "Suggested"), meta: { label: t("insights.repricing.suggested", "Suggested"), numeric: true }, cell: ({ row }) => <span className="font-semibold">{fmtMoney(row.original.suggested_price)}</span> },
      {
        id: "uplift",
        header: t("insights.repricing.uplift", "Uplift"),
        meta: { label: t("insights.repricing.uplift", "Uplift"), numeric: true },
        cell: ({ row }) => (
          <span className={cn("inline-flex items-center gap-0.5", TINT.success)}>
            <ArrowUpRight className="size-3" aria-hidden="true" />
            {fmtMoney(row.original.uplift)}
          </span>
        ),
      },
    ],
    [t],
  );

  if (q.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-full max-w-md" />
        <DataTable columns={columns} data={[]} loading hideViewOptions />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <ErrorState
        title={t("insights.repricing.error", "Couldn't load repricing suggestions")}
        onRetry={() => void q.refetch()}
        retrying={q.isFetching}
      />
    );
  }

  const { suggestions, target_pct, skus_considered, skus_cost_unknown } = q.data;
  const costed = skus_considered - skus_cost_unknown;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("insights.repricing.coverage", "Target {{target}} · {{costed}} of {{total}} priced items have full cost", {
            target: fmtPercent(target_pct / 100),
            costed,
            total: skus_considered,
          })}
        </p>
        <Button size="sm" variant="outline" onClick={() => void navigate({ to: "/menu/pricing" })}>
          {t("insights.repricing.adjust", "Adjust prices")}
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={suggestions}
        getRowId={(s) => `${s.menu_item_id}-${s.size_label}`}
        hideViewOptions
        emptyState={
          <EmptyState
            title={t("insights.repricing.none", "No repricing opportunities")}
            description={
              skus_cost_unknown > 0
                ? t("insights.repricing.noneCost", "Add recipe costs to more items to unlock suggestions.")
                : t("insights.repricing.noneOk", "Every costed item is at or above its target margin.")
            }
          />
        }
      />
    </div>
  );
}
