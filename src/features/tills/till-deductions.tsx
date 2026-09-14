import { useTranslation } from "react-i18next";
import { PackageMinus } from "lucide-react";

import { ListCard, ListRow } from "@/components/app/list-row";
import { SectionHeader } from "@/components/app/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtNumber, fmtUnit } from "@/lib/format";

import { useTillDeductions, type DeductionLogRow } from "./api";

export interface DeductionTotal {
  key: string;
  name: string;
  unit: string;
  /** Net stock used: sales minus what voids/refunds put back. */
  used: number;
  /** Stock put back by voids/refunds (positive). */
  returned: number;
}

/**
 * One line per stock item: the till's `sale` rows are positive, `void_restock`
 * and `refund_restock` rows are negative (goods put back).
 */
export function summarizeDeductions(rows: DeductionLogRow[]): DeductionTotal[] {
  const byItem = new Map<string, DeductionTotal>();
  for (const r of rows) {
    const key = `${r.inventory_item_id}:${r.unit}`;
    const cur = byItem.get(key) ?? { key, name: r.item_name, unit: r.unit, used: 0, returned: 0 };
    cur.used += r.quantity_deducted;
    if (r.quantity_deducted < 0) cur.returned -= r.quantity_deducted;
    byItem.set(key, cur);
  }
  return [...byItem.values()].sort((a, b) => b.used - a.used || a.name.localeCompare(b.name));
}

const qty = (n: number, unit: string) => `${fmtNumber(Math.round(n * 1000) / 1000)} ${fmtUnit(unit)}`.trim();

/** Stock the till's orders consumed (T16). Hidden when the till used none. */
export function TillDeductions({ tillId, enabled }: { tillId: string | null; enabled: boolean }) {
  const { t } = useTranslation();
  const q = useTillDeductions(tillId, enabled);
  if (q.isLoading) return <Skeleton className="h-24 w-full rounded-2xl" />;
  if (q.isError) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        {t("tills.deductions.loadError", "Couldn't load the stock used by this till.")}
      </p>
    );
  }
  const totals = summarizeDeductions(q.data ?? []);
  if (totals.length === 0) return null;
  return <DeductionList totals={totals} />;
}

export function DeductionList({ totals }: { totals: DeductionTotal[] }) {
  const { t } = useTranslation();
  return (
    <section className="space-y-3" data-testid="till-deductions">
      <SectionHeader
        as="h3"
        icon={PackageMinus}
        title={t("tills.deductions.title", "Stock used")}
        count={totals.length}
      />
      <ListCard>
        {totals.map((d) => (
          <ListRow
            key={d.key}
            className="min-h-12 sm:px-4"
            title={d.name}
            meta={
              d.returned > 0
                ? t("tills.deductions.returned", { amount: qty(d.returned, d.unit), defaultValue: "{{amount}} put back by voids" })
                : undefined
            }
            value={qty(d.used, d.unit)}
            numericValue
          />
        ))}
      </ListCard>
    </section>
  );
}
