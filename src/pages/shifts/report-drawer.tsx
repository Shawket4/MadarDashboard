import { useTranslation } from "react-i18next";
import { Printer, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Dialog, DialogContent } from "@/shared/ui/dialog";
import { useGetShiftReport } from "@/shared/api/generated/api";
import { usePaymentMethods } from "@/shared/hooks/use-payment-methods";
import { fmtDateTime, fmtDuration, fmtMoney } from "@/shared/lib/format";


export function ShiftReportDrawer({ open, onClose, shiftId }: { open: boolean; onClose: () => void; shiftId: string | null }) {
  const { t } = useTranslation();
  const { getLabel } = usePaymentMethods();
  const { data: report, isLoading } = useGetShiftReport(shiftId ?? "", { query: { enabled: !!shiftId } });

  const handlePrint = () => {
    if (!report) return;
    const w = window.open("", "_blank", "width=420,height=700");
    if (!w) return;
    const rows = report.payment_summary
      .map((p) => `<tr><td>${getLabel(p.payment_method)}</td><td class="r">${p.order_count}</td><td class="r">${fmtMoney(p.total)}</td></tr>`)
      .join("");
    const movRows = report.cash_movements
      .map((m) => `<tr><td>${m.note}</td><td class="r ${m.amount >= 0 ? "pos" : "neg"}">${fmtMoney(Math.abs(m.amount))}</td></tr>`)
      .join("");
    w.document.write(`<!doctype html><html><head><title>Shift Report</title><style>
      body{font-family:'Cairo',sans-serif;padding:20px;font-size:12px}
      h1{font-size:14px;margin:0 0 4px;text-align:center}
      h2{font-size:11px;margin:16px 0 4px;text-transform:uppercase;color:#666;border-bottom:1px solid #ddd;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}
      td{padding:3px 0;border-bottom:1px dashed #eee}
      .r{text-align:end}
      .bold{font-weight:700}
      .pos{color:#16a34a}
      .neg{color:#dc2626}
    </style></head><body>
      <h1>Shift Report</h1>
      <p style="text-align:center;font-size:10px;color:#666">${fmtDateTime(report.shift.opened_at)} → ${report.shift.closed_at ? fmtDateTime(report.shift.closed_at) : "now"}</p>
      <p style="text-align:center;font-size:10px">Teller: ${report.shift.teller_name}</p>
      <h2>Payment Breakdown</h2>
      <table>${rows}</table>
      <h2>Cash Summary</h2>
      <table>
        <tr><td>Opening Cash</td><td class="r">${fmtMoney(report.shift.opening_cash)}</td></tr>
        <tr><td>Cash Sales</td><td class="r">${fmtMoney(report.payment_summary.find(p => p.payment_method === "cash" || p.payment_method === "talabat_cash")?.total ?? 0)}</td></tr>
        <tr><td>Net Movements</td><td class="r">${fmtMoney(report.cash_movements_net)}</td></tr>
        <tr class="bold"><td>Expected</td><td class="r">${fmtMoney(report.shift.closing_cash_system)}</td></tr>
        ${report.shift.closing_cash_declared !== null ? `<tr class="bold"><td>Declared</td><td class="r">${fmtMoney(report.shift.closing_cash_declared)}</td></tr>` : ""}
      </table>
      ${movRows ? `<h2>Cash Movements</h2><table>${movRows}</table>` : ""}
      <p style="text-align:center;font-size:9px;color:#999;margin-top:24px">Printed ${new Date().toLocaleString()}</p>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent sheet="right" showClose={false} className="p-0">
        <div className="sticky top-0 z-10 bg-background border-b p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{t("shifts.report.title")}</p>
            {report && <p className="font-bold">{report.shift.teller_name}</p>}
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="iconSm" onClick={handlePrint} disabled={!report}><Printer size={14} /></Button>
            <Button variant="ghost" size="iconSm" onClick={onClose}><X /></Button>
          </div>
        </div>

        {isLoading || !report ? (
          <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        ) : (
          <div className="p-4 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("shifts.opened")}</span><span>{fmtDateTime(report.shift.opened_at)}</span></div>
                {report.shift.closed_at ? (
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("shifts.closed")}</span><span>{fmtDateTime(report.shift.closed_at)}</span></div>
                ) : (
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("common.status")}</span><Badge variant="success">{t("shiftStatus.open")}</Badge></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">{t("shifts.duration")}</span><span className="font-mono">{fmtDuration(report.shift.opened_at, report.shift.closed_at)}</span></div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t("shifts.report.paymentBreakdown")}</p>
                {report.payment_summary.map((p) => (
                  <div key={p.payment_method} className="flex items-center justify-between py-1 border-b last:border-0">
                    <span className="text-sm">{getLabel(p.payment_method)} <span className="text-muted-foreground text-xs">× {p.order_count}</span></span>
                    <span className="font-semibold tabular">{fmtMoney(p.total)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 mt-2 border-t">
                  <span className="text-sm font-bold">{t("shifts.report.totalRevenue")}</span>
                  <span className="text-lg font-bold text-primary tabular">{fmtMoney(report.total_payments)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t("shifts.report.cashSummary")}</p>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("shifts.openingCash")}</span><span className="tabular">{fmtMoney(report.shift.opening_cash)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("shifts.report.cashSales")}</span><span className="tabular">{fmtMoney(report.payment_summary.find(p => p.payment_method === "cash" || p.payment_method === "talabat_cash")?.total ?? 0)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("shifts.report.movementsIn")}</span><span className="tabular text-success">+{fmtMoney(report.cash_movements_in)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("shifts.report.movementsOut")}</span><span className="tabular text-destructive">{fmtMoney(report.cash_movements_out)}</span></div>
                {/* FIX: open shifts have no system closing cash yet — show "—", not 0.00 */}
                <div className="flex justify-between text-sm pt-2 border-t mt-2"><span className="font-bold">{t("shifts.expectedCash")}</span><span className="tabular font-bold">{fmtMoney(report.shift.closing_cash_system)}</span></div>
                {report.shift.closing_cash_declared !== null && (
                  <>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t("shifts.declaredCash")}</span><span className="tabular">{fmtMoney(report.shift.closing_cash_declared)}</span></div>
                    {report.shift.cash_discrepancy !== null && (
                      <div className="flex justify-between text-sm font-bold">
                        <span className={(report.shift.cash_discrepancy ?? 0) < 0 ? "text-destructive" : (report.shift.cash_discrepancy ?? 0) > 0 ? "text-success" : "text-muted-foreground"}>
                          {fmtMoney(report.shift.cash_discrepancy ?? 0)}
                        </span>
                        <span className="tabular">
                          {(report.shift.cash_discrepancy ?? 0) === 0 ? t("shifts.exactMatch") : `${(report.shift.cash_discrepancy ?? 0) > 0 ? t("shifts.over") : t("shifts.short")} ${fmtMoney(Math.abs(report.shift.cash_discrepancy ?? 0))}`}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {report.cash_movements.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{t("shifts.report.movements")}</p>
                  {report.cash_movements.map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-1 border-b last:border-0 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{m.note}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateTime(m.created_at)}</p>
                      </div>
                      <span className={`font-semibold tabular ${m.amount >= 0 ? "text-success" : "text-destructive"}`}>
                        {m.amount >= 0 ? "+" : "−"}{fmtMoney(Math.abs(m.amount))}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


