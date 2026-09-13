import { useTranslation } from "react-i18next";
import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/app/status-pill";
import { ErrorState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { LedgerStrip, type LedgerItem } from "@/components/app/ledger-strip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useVarianceReport } from "@/data/api/generated/api";
import { fmtMoney, fmtNumber, fmtUnit } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  stocktakeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Difference is measured against BOOK stock at finalize, so the columns add
 * up: Book − Counted = Difference. The opening figure is shown only when the
 * count saw activity, as context.
 */
export function VarianceReportDialog({ stocktakeId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const report = useVarianceReport(stocktakeId ?? "", { query: { enabled: open && !!stocktakeId } });
  const data = report.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("inventory.stocktakes.varianceReport", "Variance report")}</DialogTitle>
          <DialogDescription>
            {data ? t("inventory.stocktakes.unknownCost", { count: data.unknown_cost_count, defaultValue: `${data.unknown_cost_count} item(s) with unknown cost` }) : null}
          </DialogDescription>
        </DialogHeader>

        {report.isError ? null : <LedgerStrip
          items={[
            { key: "shrink", label: t("inventory.stocktakes.shrinkage", "Shrinkage"), value: data?.total_shrinkage_value ?? 0, formatType: "money", icon: ArrowDownCircle, accent: "destructive", loading: !data },
            { key: "over", label: t("inventory.stocktakes.overage", "Overage"), value: data?.total_overage_value ?? 0, formatType: "money", icon: ArrowUpCircle, accent: "success", loading: !data },
            { key: "net", label: t("inventory.stocktakes.net", "Net variance"), value: data?.net_variance_value ?? 0, formatType: "money", icon: Scale, accent: (data?.net_variance_value ?? 0) < 0 ? "destructive" : "success", loading: !data },
          ] satisfies LedgerItem[]}
        />}

        {report.isError ? (
          <ErrorState
            title={t("inventory.stocktakes.reportFailed", "Couldn't load the variance report")}
            onRetry={() => void report.refetch()}
          />
        ) : data ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("inventory.stocktakes.ingredient", "Ingredient")}</TableHead>
                  <TableHead className="text-end">{t("inventory.stocktakes.bookStock", "Book stock")}</TableHead>
                  <TableHead className="text-end">{t("inventory.stocktakes.counted", "Counted")}</TableHead>
                  <TableHead className="text-end">{t("inventory.stocktakes.difference", "Difference")}</TableHead>
                  <TableHead className="text-end">{t("inventory.stocktakes.value", "Value")}</TableHead>
                  <TableHead>{t("inventory.stocktakes.reason", "Reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r) => {
                  const moved = Math.abs(r.book_qty - r.opening_qty) > 1e-9;
                  return (
                    <TableRow key={r.org_ingredient_id}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium">
                          {r.ingredient_name}
                          {r.is_flagged ? <StatusPill tone="warning" size="sm">{t("inventory.flagged", "Flagged")}</StatusPill> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{r.category_name}</p>
                      </TableCell>
                      <TableCell className="text-end font-mono tabular">
                        <bdi>{fmtNumber(r.book_qty)}</bdi> {fmtUnit(r.unit)}
                        {moved ? (
                          <p className="font-sans text-xs text-muted-foreground">
                            {t("inventory.stocktakes.atStart", { qty: fmtNumber(r.opening_qty), defaultValue: `was ${fmtNumber(r.opening_qty)} at start` })}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-end font-mono tabular"><bdi>{r.counted_qty != null ? fmtNumber(r.counted_qty) : "—"}</bdi></TableCell>
                      <TableCell className={cn("text-end font-mono tabular", (r.variance ?? 0) < 0 ? "text-[color-mix(in_oklch,var(--color-destructive)_60%,var(--color-foreground))]" : (r.variance ?? 0) > 0 ? "text-[color-mix(in_oklch,var(--color-success)_60%,var(--color-foreground))]" : "")}>
                        <bdi>{r.variance != null ? fmtNumber(r.variance, { signDisplay: "exceptZero" }) : "—"}</bdi>
                      </TableCell>
                      <TableCell className="text-end font-mono tabular"><bdi>{fmtMoney(r.variance_value)}</bdi></TableCell>
                      <TableCell>{r.variance_reason ? t(`inventory.varianceReasons.${r.variance_reason}`, r.variance_reason) : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
