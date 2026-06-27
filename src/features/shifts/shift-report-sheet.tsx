import { useTranslation } from "react-i18next";
import { AlertCircle, AlertTriangle, ArrowDownLeft, ArrowUpRight, X } from "lucide-react";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetShiftReport } from "@/data/api/generated/api";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  shiftId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShiftReportSheet({ shiftId, open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation();
  const side = i18n.dir() === "rtl" ? "left" : "right";
  const { data: report, isLoading, isError } = useGetShiftReport(shiftId ?? "", {
    query: { enabled: !!shiftId && open },
  });
  const shift = report?.shift;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} showCloseButton={false} className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-2 border-b bg-background">
          <div className="min-w-0">
            <SheetTitle>{t("shifts.report.title", "Shift report")}</SheetTitle>
            <SheetDescription>{shift ? shift.teller_name : t("common.loading", "Loading…")}</SheetDescription>
          </div>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-sm" aria-label={t("common.close", "Close")}>
              <X className="size-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="space-y-4 p-4">
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">{t("shifts.report.loadError", "Could not load the shift report. Please try again.")}</p>
            </div>
          ) : isLoading || !report || !shift ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <Card className="py-0">
                <CardContent className="space-y-2 p-4 text-sm">
                  <Row label={t("shifts.opened", "Opened")} value={fmtDateTime(shift.opened_at)} />
                  {shift.closed_at ? <Row label={t("shifts.closed", "Closed")} value={fmtDateTime(shift.closed_at)} /> : null}
                </CardContent>
              </Card>

              {/* Payment summary */}
              <Card className="py-0">
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("shifts.paymentSummary", "Payment summary")}
                  </p>
                  {report.payment_summary.length === 0 ? (
                    <p className="text-muted-foreground">{t("common.noResults", "No results found")}</p>
                  ) : (
                    report.payment_summary.map((p) => (
                      <div key={p.payment_method} className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">
                          {t(`payments.${p.payment_method}`, p.payment_method)}
                          <span className="ms-1 text-xs">({p.order_count})</span>
                        </span>
                        <span className="tabular">{fmtMoney(p.total)}</span>
                      </div>
                    ))
                  )}
                  <div className="mt-1 flex items-center justify-between gap-2 border-t pt-2 font-semibold">
                    <span>{t("shifts.netPayments", "Net payments")}</span>
                    <span className="tabular">{fmtMoney(report.net_payments)}</span>
                  </div>
                  {report.voided_amount ? (
                    <Row label={t("dashboard.voided", "Voided")} value={fmtMoney(report.voided_amount)} className="text-destructive" />
                  ) : null}
                </CardContent>
              </Card>

              {/* Cash reconciliation */}
              <Card className="py-0">
                <CardContent className="space-y-2 p-4 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("shifts.cashReconciliation", "Cash reconciliation")}
                  </p>
                  <Row label={t("shifts.openingCash", "Opening cash")} value={fmtMoney(shift.opening_cash)} />
                  {shift.opening_cash_was_edited ? (
                    <>
                      {shift.opening_cash_original != null ? (
                        <Row
                          label={t("shifts.expectedOpening", "Expected (carryover)")}
                          value={fmtMoney(shift.opening_cash_original)}
                          className="text-muted-foreground"
                        />
                      ) : null}
                      <div className="mt-1 space-y-1 rounded-md border border-warning/30 bg-warning/10 p-2 text-warning">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span>{t("shifts.openingEdited", "Opening cash edited")}</span>
                          {shift.opening_cash_original != null ? (
                            <span className="ms-auto tabular">
                              {shift.opening_cash - shift.opening_cash_original > 0 ? "+" : ""}
                              {fmtMoney(shift.opening_cash - shift.opening_cash_original)}
                            </span>
                          ) : null}
                        </div>
                        {shift.opening_cash_edit_reason ? (
                          <p className="text-xs text-foreground/80">{shift.opening_cash_edit_reason}</p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                  <Row label={t("shifts.cashIn", "Cash in")} value={fmtMoney(report.cash_movements_in)} />
                  <Row label={t("shifts.cashOut", "Cash out")} value={fmtMoney(report.cash_movements_out)} />
                  {shift.closing_cash_system != null ? (
                    <Row label={t("shifts.expectedCash", "Expected cash")} value={fmtMoney(shift.closing_cash_system)} />
                  ) : null}
                  {shift.closing_cash_declared != null ? (
                    <Row label={t("shifts.closingCash", "Counted cash")} value={fmtMoney(shift.closing_cash_declared)} />
                  ) : null}
                  {shift.cash_discrepancy != null ? (
                    <div
                      className={cn(
                        "mt-1 flex items-center justify-between gap-2 border-t pt-2 font-semibold",
                        shift.cash_discrepancy === 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      <span>{t("shifts.discrepancy", "Discrepancy")}</span>
                      <span className="tabular">{fmtMoney(shift.cash_discrepancy)}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Cash movements */}
              {report.cash_movements.length > 0 ? (
                <Card className="py-0">
                  <CardContent className="space-y-2 p-4 text-sm">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("shifts.cashMovements", "Cash movements")}
                    </p>
                    {report.cash_movements.map((m, i) => (
                      <div key={i} className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate">{m.note}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.moved_by_name} · {fmtDateTime(m.created_at)}
                          </p>
                        </div>
                        <span className={cn("inline-flex shrink-0 items-center gap-0.5 tabular", m.amount < 0 ? "text-destructive" : "text-success")}>
                          {m.amount < 0
                            ? <ArrowUpRight className="size-3.5" aria-hidden="true" />
                            : <ArrowDownLeft className="size-3.5" aria-hidden="true" />}
                          {fmtMoney(m.amount)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
