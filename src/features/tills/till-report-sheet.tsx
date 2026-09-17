import { useTranslation } from "react-i18next";
import { AlertTriangle, X } from "lucide-react";

import { ErrorState } from "@/components/app/empty-state";
import { ListCard, ListRow } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";

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
import { useTillReport, useTillSummary } from "./api";
import { FlagBadge, VerificationBadge } from "./till-badges";
import { ReconciliationTable } from "./reconciliation-table";
import { TillDeductions } from "./till-deductions";
import { TillSpotViews } from "./till-spot-views";
import { fmtDateTime, fmtMoney, fmtMoneySigned } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  tillId: string | null;
  onOpenTill?: (id: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TillReportSheet({ tillId, open, onOpenChange, onOpenTill }: Props) {
  const { t, i18n } = useTranslation();
  const side = i18n.dir() === "rtl" ? "left" : "right";
  const { data: report, isLoading, isError, refetch } = useTillReport(tillId, open);
  const { data: summary } = useTillSummary(tillId, open);
  const shift = report?.till;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} showCloseButton={false} className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
        <SheetHeader className="sticky top-0 z-10 flex-row items-center justify-between gap-2 border-b bg-background">
          <div className="min-w-0">
            <SheetTitle>{t("tills.report.title", "Till report")}</SheetTitle>
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
            <ErrorState title={t("tills.report.loadError", "Could not load the till report. Please try again.")} onRetry={() => void refetch()} />
          ) : isLoading || !report || !shift ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <>
              <Card className="rounded-2xl py-0 shadow-none">
                <CardContent className="space-y-2 p-4 text-sm">
                  <Row label={t("tills.opened", "Opened")} value={fmtDateTime(shift.opened_at)} />
                  {shift.closed_at ? <Row label={t("tills.closed", "Closed")} value={fmtDateTime(shift.closed_at)} /> : null}
                  {shift.device_code || shift.device_label ? (
                    <Row label={t("tills.device", "Device")} value={[shift.device_code, shift.device_label].filter(Boolean).join(" · ")} />
                  ) : null}
                  {report.order_number_range?.first != null ? (
                    <Row
                      label={t("tills.orderRange", "Order numbers")}
                      value={[report.order_number_range.first, report.order_number_range.last].map((n) => (report.order_number_range.device_code ? `${report.order_number_range.device_code}-${n}` : String(n))).join(" – ")}
                    />
                  ) : null}
                  {report.open_bills_at_close != null ? (
                    <Row label={t("tills.openBillsAtClose", "Open bills at close")} value={String(report.open_bills_at_close)} />
                  ) : null}
                  {report.held_orders_left_open ? (
                    <Row
                      label={t("tills.heldOrdersLeftOpen", "Held orders left open")}
                      value={
                        report.held_orders_left_open_total != null
                          ? `${report.held_orders_left_open} · ${fmtMoney(report.held_orders_left_open_total)}`
                          : String(report.held_orders_left_open)
                      }
                    />
                  ) : null}
                  {report.old_bills_at_close != null ? (
                    <Row label={t("tills.oldBillsAtClose", "Old open bills at close")} value={String(report.old_bills_at_close)} />
                  ) : null}
                  <div className="flex flex-wrap gap-1 pt-1">
                    <VerificationBadge verification={shift.verification} />
                    <FlagBadge till={shift} onOpenOther={onOpenTill} />
                  </div>
                </CardContent>
              </Card>

              {summary ? (
                <Card className="rounded-2xl py-0 shadow-none" data-testid="till-summary">
                  <CardContent className="space-y-2 p-4 text-sm">
                    <h3 className="text-sm font-semibold">{t("tills.salesSummary", "Sales")}</h3>
                    <Row label={t("dashboard.orders", "Orders")} value={String(summary.total_orders)} />
                    <Row label={t("dashboard.revenue", "Revenue")} value={fmtMoney(summary.total_revenue)} />
                    {summary.total_discount ? <Row label={t("nav.discounts", "Discounts")} value={fmtMoney(summary.total_discount)} /> : null}
                    {summary.total_tax ? <Row label={t("tills.tax", "Tax")} value={fmtMoney(summary.total_tax)} /> : null}
                    {summary.voided_orders ? <Row label={t("orders.voided", "Voided")} value={String(summary.voided_orders)} className="text-destructive" /> : null}
                  </CardContent>
                </Card>
              ) : null}

              {/* Payment summary */}
              <Card className="rounded-2xl py-0 shadow-none">
                <CardContent className="space-y-2 p-4 text-sm">
                  <h3 className="text-sm font-semibold">{t("tills.paymentSummary", "Payment summary")}</h3>
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
                    <span>{t("tills.netPayments", "Net payments")}</span>
                    <span className="tabular">{fmtMoney(report.net_payments)}</span>
                  </div>
                  {/* Tips sit OUTSIDE the method buckets and outside net payments —
                      they are not revenue, and folding them into a bucket is what
                      used to make this card disagree with the sales report. */}
                  {report.total_tips ? (
                    <div className="mt-1 space-y-1 border-t pt-2">
                      <Row label={t("tills.tips", "Tips")} value={fmtMoney(report.total_tips)} />
                      {report.cash_tips ? (
                        <Row
                          label={t("tills.tipsCash", "of which cash")}
                          value={fmtMoney(report.cash_tips)}
                          className="ps-3 text-xs"
                        />
                      ) : null}
                    </div>
                  ) : null}
                  {report.voided_amount ? (
                    <Row label={t("dashboard.voided", "Voided")} value={fmtMoney(report.voided_amount)} className="text-destructive" />
                  ) : null}
                </CardContent>
              </Card>

              <ReconciliationTable lines={report.reconciliation ?? []} />

              {/* Cash reconciliation */}
              <Card className="rounded-2xl py-0 shadow-none">
                <CardContent className="space-y-2 p-4 text-sm">
                  <h3 className="text-sm font-semibold">{t("tills.cashReconciliation", "Cash reconciliation")}</h3>
                  <Row label={t("tills.openingCash", "Opening cash")} value={fmtMoney(shift.opening_cash)} />
                  {shift.opening_cash_was_edited ? (
                    <>
                      {shift.opening_cash_original != null ? (
                        <Row
                          label={t("tills.expectedOpening", "Expected (carryover)")}
                          value={fmtMoney(shift.opening_cash_original)}
                          className="text-muted-foreground"
                        />
                      ) : null}
                      <div className="mt-1 space-y-1 rounded-md border border-warning/30 bg-warning/10 p-2 text-warning">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <AlertTriangle className="size-3.5 shrink-0" />
                          <span>{t("tills.openingEdited", "Opening cash edited")}</span>
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
                  <Row label={t("tills.cashIn", "Cash in")} value={fmtMoney(report.cash_movements_in)} />
                  <Row label={t("tills.cashOut", "Cash out")} value={fmtMoney(report.cash_movements_out)} />
                  {shift.closing_cash_system != null ? (
                    <Row label={t("tills.expectedCash", "Expected cash")} value={fmtMoney(shift.closing_cash_system)} />
                  ) : null}
                  {shift.closing_cash_declared != null ? (
                    <Row label={t("tills.closingCash", "Counted cash")} value={fmtMoney(shift.closing_cash_declared)} />
                  ) : null}
                  {shift.cash_discrepancy != null ? (
                    <div
                      className={cn(
                        "mt-1 flex items-center justify-between gap-2 border-t pt-2 font-semibold",
                        shift.cash_discrepancy === 0 ? "text-success" : "text-destructive",
                      )}
                    >
                      <span>{t("tills.discrepancy", "Discrepancy")}</span>
                      <span className="tabular">{fmtMoney(shift.cash_discrepancy)}</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <TillSpotViews tillId={tillId} enabled={open} />

              <TillDeductions tillId={tillId} enabled={open} />

              {/* Cash movements */}
              {report.cash_movements.length > 0 ? (
                <section className="space-y-3">
                  <SectionHeader as="h3" title={t("tills.cashMovements", "Cash movements")} count={report.cash_movements.length} />
                  <ListCard>
                    {report.cash_movements.map((m, i) => (
                      <ListRow
                        key={i}
                        variant="ledger"
                        className="sm:px-4"
                        sign={m.amount < 0 ? "out" : "in"}
                        title={m.note || t(m.amount < 0 ? "tills.cashOut" : "tills.cashIn")}
                        meta={`${m.moved_by_name} · ${fmtDateTime(m.created_at)}`}
                        value={fmtMoneySigned(m.amount)}
                        numericValue
                      />
                    ))}
                  </ListCard>
                </section>
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
      <bdi className="font-mono font-medium tabular-nums">{value}</bdi>
    </div>
  );
}
