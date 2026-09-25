/**
 * A combo's mix (§2.6): per slot, what customers picked, at which size, how
 * often, and what the upgrades brought in.
 */
import { useTranslation } from "react-i18next";

import { ErrorState } from "@/components/app/empty-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtMoney, fmtNumber, fmtShare } from "@/lib/format";
import { useComboMix } from "@/features/combos/api";
import type { BundlesReportParams } from "@/features/combos/types";
import { sizeLabelText } from "@/features/combos/use-menu-options";

export function MixDialog({
  comboId,
  name,
  params,
  onClose,
}: {
  comboId: string;
  name: string;
  params: Omit<BundlesReportParams, "kind">;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const q = useComboMix(comboId, params);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("reports.bundles.mixTitle", { defaultValue: "What went into {{name}}", name })}</DialogTitle>
          <DialogDescription>{t("reports.bundles.mixHint", "Every pick per slot in this period, with the extra it brought in.")}</DialogDescription>
        </DialogHeader>
        {q.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : q.isError || !q.data ? (
          <ErrorState onRetry={() => void q.refetch()} />
        ) : q.data.slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("reports.bundles.mixEmpty", "No picks in this period.")}</p>
        ) : (
          <div className="space-y-5">
            {q.data.slots.map((s) => {
              const total = s.picks.reduce((n, p) => n + p.count, 0);
              return (
                <section key={s.slot_id} aria-label={s.name} className="space-y-2">
                  <h3 className="text-sm font-semibold">{s.name}</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        <th scope="col" className="py-1 text-start">
                          {t("reports.bundles.mixItem", "Pick")}
                        </th>
                        <th scope="col" className="py-1 text-end">
                          {t("reports.bundles.mixCount", "Times")}
                        </th>
                        <th scope="col" className="py-1 text-end">
                          {t("reports.bundles.mixShare", "Share")}
                        </th>
                        <th scope="col" className="py-1 text-end">
                          {t("reports.bundles.mixExtra", "Extras")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...s.picks]
                        .sort((a, b) => b.count - a.count)
                        .map((p) => (
                          <tr key={`${p.menu_item_id}:${p.size_label ?? ""}`} className="border-t">
                            <td className="py-1.5">
                              {p.name}
                              {p.size_label ? <span className="text-muted-foreground"> · {sizeLabelText(p.size_label, t)}</span> : null}
                            </td>
                            <td className="py-1.5 text-end font-mono tabular-nums">{fmtNumber(p.count)}</td>
                            <td className="py-1.5 text-end font-mono tabular-nums">{fmtShare(p.count, total)}</td>
                            <td className="py-1.5 text-end font-mono tabular-nums">
                              <bdi>{p.surcharge_total > 0 ? fmtMoney(p.surcharge_total) : "—"}</bdi>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </section>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
