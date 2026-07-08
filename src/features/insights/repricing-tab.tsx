import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRepricing } from "@/data/api/generated/api";
import { fmtMoney, fmtPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

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

  if (q.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (q.isError || !q.data) {
    return <EmptyState title={t("insights.repricing.error", "Couldn't load repricing suggestions")} />;
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

      {suggestions.length === 0 ? (
        <EmptyState
          title={t("insights.repricing.none", "No repricing opportunities")}
          description={
            skus_cost_unknown > 0
              ? t("insights.repricing.noneCost", "Add recipe costs to more items to unlock suggestions.")
              : t("insights.repricing.noneOk", "Every costed item is at or above its target margin.")
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("insights.repricing.item", "Item")}</TableHead>
                <TableHead className="text-end">{t("insights.repricing.current", "Current")}</TableHead>
                <TableHead className="text-end">{t("insights.repricing.cost", "Cost")}</TableHead>
                <TableHead className="text-end">{t("insights.repricing.marginCol", "Margin")}</TableHead>
                <TableHead className="text-end">{t("insights.repricing.suggested", "Suggested")}</TableHead>
                <TableHead className="text-end">{t("insights.repricing.uplift", "Uplift")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((s) => (
                <TableRow key={`${s.menu_item_id}-${s.size_label}`}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {s.below_cost ? (
                        <TriangleAlert className="size-3.5 shrink-0 text-destructive" aria-hidden="true" />
                      ) : null}
                      <span className="font-medium">{s.item_name}</span>
                      {s.size_label !== "one_size" ? (
                        <span className="text-xs text-muted-foreground">{s.size_label}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-end tabular-nums">{fmtMoney(s.current_price)}</TableCell>
                  <TableCell className="text-end tabular-nums">{fmtMoney(s.cost)}</TableCell>
                  <TableCell className={cn("text-end tabular-nums", s.below_cost && "text-destructive")}>
                    {fmtPercent(s.margin_pct / 100)}
                  </TableCell>
                  <TableCell className="text-end font-semibold tabular-nums">{fmtMoney(s.suggested_price)}</TableCell>
                  <TableCell className="text-end tabular-nums text-emerald-600 dark:text-emerald-400">
                    <span className="inline-flex items-center gap-0.5">
                      <ArrowUpRight className="size-3" aria-hidden="true" />
                      {fmtMoney(s.uplift)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
