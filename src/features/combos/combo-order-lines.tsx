/**
 * The order sheet's combo and deal pieces (C12, §7.7): the combo's header
 * row (its name, the count and what the whole combo rang at), the note under
 * each part (its slot and its upgrade), and the note under a plain line that a
 * deal took something off.
 */
import { useTranslation } from "react-i18next";
import { Layers } from "lucide-react";

import { StatusPill } from "@/components/app/status-pill";
import { fmtMoney, fmtNumber } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";

import type { ComboLineFields, OrderDeal } from "./contract";

type HeaderLine = { id: string; item_name: string; name_translations?: unknown; quantity: number; notes?: string | null } & ComboLineFields;

export function ComboHeaderRow({ line, total, lang }: { line: HeaderLine; total: number; lang: string }) {
  const { t } = useTranslation();
  const name = getTranslatedName({ name: line.item_name, name_translations: line.name_translations }, lang);
  return (
    <div data-testid="combo-header" data-line-kind="combo" className="flex items-start justify-between gap-2 pt-2">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
          <bdi className="tabular">{fmtNumber(line.quantity)} ×</bdi> {name}
          <StatusPill tone="info" size="sm" icon={Layers}>
            {t("combos.order.combo", "Combo")}
          </StatusPill>
        </p>
        {line.combo_unit_price != null ? (
          <p className="text-xs text-muted-foreground tabular">
            {t("combos.order.each", { defaultValue: "{{price}} each, before extras", price: fmtMoney(line.combo_unit_price) })}
          </p>
        ) : null}
        {line.notes ? <p className="mt-1 text-xs italic text-muted-foreground">{line.notes}</p> : null}
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums">{fmtMoney(total)}</span>
    </div>
  );
}

export function ComboPartNote({ line }: { line: ComboLineFields }) {
  const { t } = useTranslation();
  const surcharge = line.combo_surcharge ?? 0;
  return (
    <p data-testid="combo-part-note" className="text-xs text-muted-foreground tabular">
      {line.combo_slot_name ? <span>{line.combo_slot_name}</span> : null}
      {surcharge > 0 ? (
        <>
          {line.combo_slot_name ? " · " : null}
          <bdi>{t("combos.order.upgrade", { defaultValue: "+{{amount}} upgrade", amount: fmtMoney(surcharge) })}</bdi>
        </>
      ) : null}
    </p>
  );
}

export function DealLineNote({ line, deals, lang }: { line: { id: string } & ComboLineFields; deals: OrderDeal[]; lang: string }) {
  const { t } = useTranslation();
  const cut = line.deal_minor ?? 0;
  if (cut <= 0) return null;
  const deal = deals.find((d) => d.lines.some((l) => l.order_item_id === line.id));
  const name = deal ? getTranslatedName({ name: deal.name, name_translations: deal.name_translations }, lang) : t("combos.order.aDeal", "Deal");
  return (
    <p data-testid="deal-line-note" className="text-xs text-muted-foreground tabular">
      <bdi>{t("combos.order.dealCut", { defaultValue: "{{deal}} · {{amount}}", deal: name, amount: fmtMoney(-cut) })}</bdi>
    </p>
  );
}
