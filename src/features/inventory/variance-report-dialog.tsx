import { useTranslation } from "react-i18next";
import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
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

export function VarianceReportDialog({ stocktakeId, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const report = useVarianceReport(stocktakeId ?? "", { query: { enabled: open && !!stocktakeId } });
  const data = report.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("inventory.stocktakes.varianceReport", "Variance report")}</DialogTitle>
          <DialogDescription>
            {data ? t("inventory.stocktakes.unknownCost", { count: data.unknown_cost_count, defaultValue: `${data.unknown_cost_count} item(s) with unknown cost` }) : null}
          </DialogDescription>
        </DialogHeader>

        <LedgerStrip
          items={[
            { key: "shrink", label: t("inventory.stocktakes.shrinkage", "Shrinkage"), value: data?.total_shrinkage_value ?? 0, formatType: "money", icon: ArrowDownCircle, accent: "destructive", loading: !data },
            { key: "over", label: t("inventory.stocktakes.overage", "Overage"), value: data?.total_overage_value ?? 0, formatType: "money", icon: ArrowUpCircle, accent: "success", loading: !data },
            { key: "net", label: t("inventory.stocktakes.net", "Net variance"), value: data?.net_variance_value ?? 0, formatType: "money", icon: Scale, accent: (data?.net_variance_value ?? 0) < 0 ? "destructive" : "success", loading: !data },
          ] satisfies LedgerItem[]}
        />

        {data ? (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("inventory.stocktakes.ingredient", "Ingredient")}</TableHead>
                    <TableHead className="text-end">{t("inventory.stocktakes.expected", "Expected")}</TableHead>
                    <TableHead className="text-end">{t("inventory.stocktakes.counted", "Counted")}</TableHead>
                    <TableHead className="text-end">{t("inventory.stocktakes.difference", "Difference")}</TableHead>
                    <TableHead className="text-end">{t("inventory.stocktakes.value", "Value")}</TableHead>
                    <TableHead>{t("inventory.stocktakes.reason", "Reason")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((r) => (
                    <TableRow key={r.org_ingredient_id}>
                      <TableCell className="flex items-center gap-2">
                        {r.ingredient_name}
                        {r.is_flagged ? <Badge variant="secondary" className="bg-warning/10 text-warning">{t("inventory.flagged", "Flagged")}</Badge> : null}
                      </TableCell>
                      <TableCell className="text-end tabular">{fmtNumber(r.expected_qty)} {fmtUnit(r.unit)}</TableCell>
                      <TableCell className="text-end tabular">{r.counted_qty != null ? fmtNumber(r.counted_qty) : "—"}</TableCell>
                      <TableCell className={cn("text-end tabular", (r.variance ?? 0) < 0 ? "text-destructive" : (r.variance ?? 0) > 0 ? "text-success" : "")}>
                        {r.variance != null ? `${r.variance > 0 ? "+" : ""}${fmtNumber(r.variance)}` : "—"}
                      </TableCell>
                      <TableCell className="text-end tabular">{fmtMoney(r.variance_value)}</TableCell>
                      <TableCell>{r.variance_reason ? t(`inventory.varianceReasons.${r.variance_reason}`, r.variance_reason) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
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
