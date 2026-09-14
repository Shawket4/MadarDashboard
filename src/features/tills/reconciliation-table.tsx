import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { fmtMoney } from "@/lib/format";
import { StatusPill, type StatusTone } from "@/components/app/status-pill";

import type { TillReconciliationLine } from "./api";

const STATUS_TONE: Record<string, StatusTone> = {
  checked: "success",
  disagreed: "danger",
  unreviewed: "neutral",
};

/** Per-method close check (TILLS decision 11). Empty for tills closed before the rework. */
export function ReconciliationTable({ lines }: { lines: TillReconciliationLine[] }) {
  const { t } = useTranslation();
  if (lines.length === 0) return null;
  return (
    <Card className="rounded-2xl py-0 shadow-none">
      <CardContent className="space-y-2 p-4 text-sm">
        <h3 className="text-sm font-semibold">{t("tills.reconciliation.title", "Payment check")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="reconciliation-table">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-1 text-start font-medium">{t("tills.reconciliation.method", "Method")}</th>
                <th className="py-1 text-end font-medium">{t("tills.reconciliation.system", "System total")}</th>
                <th className="py-1 text-end font-medium">{t("tills.reconciliation.declared", "Declared")}</th>
                <th className="py-1 text-end font-medium">{t("common.status", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.method} className="border-t align-top" data-testid="reconciliation-line">
                  <td className="py-1.5">
                    {t(`payments.${l.method}`, l.method)}
                    {l.note ? <p className="text-xs text-muted-foreground">{l.note}</p> : null}
                    {l.changed_after_close ? (
                      <p className="text-xs text-warning">
                        {t("tills.reconciliation.changedAfterClose", "Changed after close: {{amount}}", {
                          amount: fmtMoney(l.current_system_total),
                        })}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-1.5 text-end font-mono tabular-nums">{fmtMoney(l.system_total)}</td>
                  <td className="py-1.5 text-end font-mono tabular-nums">{l.declared_amount != null ? fmtMoney(l.declared_amount) : "—"}</td>
                  <td className="py-1.5 text-end">
                    <StatusPill size="sm" tone={STATUS_TONE[l.status] ?? "neutral"}>{t(`tills.reconciliation.${l.status}`, l.status)}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
