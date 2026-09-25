/**
 * The small pieces every basket view shares — the cart sheet, the desktop
 * cart rail and the checkout summary — so a combo's picks and a deal read the
 * same wherever the customer looks.
 */
import { useTranslation } from "react-i18next";
import { BadgePercent } from "lucide-react";

import type { QuotedDeal } from "@/data/api/generated/models/quotedDeal";
import { fmtMoney } from "@/lib/format";
import { getTranslatedName } from "@/lib/translation";

import type { CartLine } from "../types";
import { displaySize, lineTotal } from "../utils";

/** A short, human summary of a plain line's selections (size, add-ons, extras). */
export const summarizeLine = (line: CartLine, lang: string): string => {
  const parts: string[] = [];
  const size = displaySize(line.size_label);
  if (size) parts.push(size);
  for (const a of line.addons) {
    const name = getTranslatedName({ name: a.name, name_translations: a.name_translations }, lang);
    parts.push(a.quantity > 1 ? `${name} ×${a.quantity}` : name);
  }
  for (const o of line.optionals) {
    parts.push(getTranslatedName({ name: o.name, name_translations: o.name_translations }, lang));
  }
  return parts.join(" · ");
};

/** A combo line's picks, one per row under it: "Coffee: Latte", "Dessert: Soft Serve · large +EGP 10". */
export function ComboPickList({ line, lang }: { line: CartLine; lang: string }) {
  if (!line.combo || line.combo.picks.length === 0) return null;
  return (
    <ul className="mt-1 space-y-0.5 border-s-2 border-border/70 ps-2.5 text-xs leading-relaxed text-muted-foreground">
      {line.combo.picks.map((p) => {
        const slot = getTranslatedName({ name: p.slot_name, name_translations: p.slot_name_translations }, lang);
        const name = getTranslatedName({ name: p.name, name_translations: p.name_translations }, lang);
        const size = displaySize(p.size_label);
        return (
          <li key={`${p.slot_id}:${p.menu_item_id}`} dir="auto">
            <span className="font-medium text-foreground/80">{slot}:</span>{" "}
            {p.quantity > 1 ? `${name} ×${p.quantity}` : name}
            {size ? ` · ${size}` : ""}
            {p.extra > 0 ? <span className="whitespace-nowrap tabular-nums"> +{fmtMoney(p.extra * p.quantity)}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

/** One row per deal the server applied: "Deal · Any 2 bakes for 250   −EGP 50". */
export function DealRows({ deals }: { deals: QuotedDeal[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  if (deals.length === 0) return null;
  return (
    <>
      {deals.map((d) => (
        <div
          key={d.deal_rule_id}
          className="flex items-center justify-between gap-3 text-[color-mix(in_oklab,var(--color-success)_50%,var(--color-foreground))]"
        >
          <dt className="flex min-w-0 items-center gap-1.5">
            <BadgePercent aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate">
              {t("order.deal.row", {
                defaultValue: "Deal · {{name}}",
                name: getTranslatedName(d, lang),
              })}
              {d.times > 1 ? ` ×${d.times}` : ""}
            </span>
          </dt>
          <dd className="shrink-0 tabular-nums">−{fmtMoney(d.discount)}</dd>
        </div>
      ))}
    </>
  );
}

/** The basket as a read-only list (checkout's summary): "2× Name   EGP x", picks under a combo. */
export function LineSummaryList({ lines }: { lines: CartLine[] }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "en";
  return (
    <ul className="space-y-2 border-b border-border/60 pb-3 text-sm">
      {lines.map((line) => {
        const summary = summarizeLine(line, lang);
        return (
          <li key={line.uid}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                <span className="tabular-nums text-muted-foreground">{line.quantity}×</span>{" "}
                <span className="font-medium">{getTranslatedName(line.item, lang)}</span>
              </span>
              <span className="shrink-0 tabular-nums">{fmtMoney(lineTotal(line))}</span>
            </div>
            {summary ? <p className="text-xs text-muted-foreground">{summary}</p> : null}
            <ComboPickList line={line} lang={lang} />
          </li>
        );
      })}
    </ul>
  );
}
