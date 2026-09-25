/**
 * The editor's live economics (C11): what the picks would cost à la carte,
 * what the customer saves, the cost and margin in the default and the worst
 * case, against the owner's minimum — and the server's warnings.
 *
 * It asks `POST /combos/economics` (nothing is saved) a moment after the form
 * settles. It informs; it NEVER blocks Save.
 */
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/data/api/errors";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useComboEconomics } from "./api";
import type { ComboEconomics, ComboWrite } from "./types";
import { fmtRate, rateOf, warningText, type WarningNames } from "./util";

function Figure({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warning" | "success" }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-end">
        <bdi
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            tone === "warning" && "text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]",
            tone === "success" && "text-[color-mix(in_oklab,var(--color-success)_50%,var(--color-foreground))]",
          )}
        >
          {value}
        </bdi>
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </dd>
    </div>
  );
}

export function EconomicsView({ econ, names }: { econ: ComboEconomics; names: WarningNames }) {
  const { t } = useTranslation();
  const min = rateOf(econ.min_margin);
  const below = (r: string | null | undefined) => min !== null && rateOf(r) !== null && (rateOf(r) as number) < min;
  const range = econ.list_min !== econ.list_max ? t("combos.econ.range", { defaultValue: "{{min}} to {{max}}", min: fmtMoney(econ.list_min), max: fmtMoney(econ.list_max) }) : undefined;

  return (
    <div className="space-y-3">
      <dl className="divide-y">
        <Figure label={t("combos.econ.price", "Combo price")} value={fmtMoney(econ.price)} />
        <Figure label={t("combos.econ.listValue", "Bought separately")} value={fmtMoney(econ.list_default)} hint={range} />
        <Figure
          label={t("combos.econ.saving", "Customer saves")}
          value={fmtMoney(econ.saving_default)}
          tone={econ.saving_default > 0 ? "success" : "warning"}
        />
        <Figure
          label={t("combos.econ.cost", "Cost (default picks)")}
          value={econ.cost_default === null ? t("combos.econ.unknown", "Unknown") : fmtMoney(econ.cost_default)}
          hint={econ.cost_max !== null && econ.cost_max !== econ.cost_default ? t("combos.econ.worstCost", { defaultValue: "Up to {{amount}}", amount: fmtMoney(econ.cost_max) }) : undefined}
        />
        <Figure
          label={t("combos.econ.margin", "Margin (default picks)")}
          value={fmtRate(econ.margin_default)}
          tone={below(econ.margin_default) ? "warning" : undefined}
        />
        <Figure
          label={t("combos.econ.marginWorst", "Margin (costliest picks)")}
          value={fmtRate(econ.margin_worst)}
          tone={below(econ.margin_worst) ? "warning" : undefined}
        />
        <Figure
          label={t("combos.econ.minMargin", "Your minimum")}
          value={min === null ? t("combos.econ.noMinimum", "Not set") : fmtRate(econ.min_margin)}
        />
      </dl>

      {econ.warnings.length > 0 ? (
        <ul aria-label={t("combos.econ.warnings", "Warnings")} className="space-y-1.5">
          {econ.warnings.map((w, i) => (
            <li
              key={`${w.code}-${i}`}
              className="flex items-start gap-2 rounded-lg bg-warning/12 p-2.5 text-sm text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]"
            >
              <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>{warningText(t, w, names)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 text-sm text-[color-mix(in_oklab,var(--color-success)_50%,var(--color-foreground))]">
          <CheckCircle2 aria-hidden className="size-4" />
          {t("combos.econ.noWarnings", "No warnings.")}
        </p>
      )}
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
        {t("combos.econ.neverBlocks", "Warnings never stop you saving.")}
      </p>
    </div>
  );
}

export function EconomicsPanel({
  body,
  branchId,
  branchLabel,
  names,
}: {
  /** The debounced form, or null while it can't describe a combo yet. */
  body: ComboWrite | null;
  branchId: string | null;
  branchLabel: string;
  names: WarningNames;
}) {
  const { t } = useTranslation();
  const q = useComboEconomics(body ? { ...body, branch_id: branchId } : null);

  return (
    <section aria-labelledby="combo-econ-title" className="space-y-3 rounded-2xl border bg-card p-4" aria-busy={q.isFetching}>
      <header className="space-y-0.5">
        <h2 id="combo-econ-title" className="text-sm font-semibold">
          {t("combos.econ.title", "Price check")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("combos.econ.pricesAt", { defaultValue: "Prices at {{scope}}", scope: branchLabel })}</p>
      </header>
      {body === null ? (
        <p className="text-sm text-muted-foreground">{t("combos.econ.needsInput", "Enter a price and at least one slot with a choice to see the figures.")}</p>
      ) : q.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      ) : q.isError || !q.data ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("combos.econ.failed", "The price check is unavailable right now. You can still save.")}
          {q.error ? <span className="block text-xs">{getErrorMessage(q.error)}</span> : null}
        </p>
      ) : (
        <EconomicsView econ={q.data} names={names} />
      )}
    </section>
  );
}
