/**
 * "Try it": the late ladder read back as money. Pick how late someone was and
 * an example salary; the card says which rung that lands on and what it docks,
 * worked out the way payroll does (rules-preview.ts). Every rung also gets a
 * worked example, so "0.25 of a day" is never left as arithmetic to do.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, FlaskConical } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DurationField, MoneyField } from "@/components/inputs";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tier } from "./rules-form";
import { selectTier, tierPiastres, type PayExample } from "./rules-preview";

export function RulesPreview({
  tiers, example, onExample,
}: {
  tiers: Tier[];
  example: PayExample;
  onExample: (e: PayExample) => void;
}) {
  const { t } = useTranslation();
  const [late, setLate] = useState<number | null>(20);
  const minutes = late !== null && Number.isFinite(late) ? late : 0;
  const tier = selectTier(tiers, minutes);
  const amount = tier ? tierPiastres(tier, example) : 0;
  const index = tier ? tiers.indexOf(tier) : -1;

  // One sample per rung: its first minute, so each row reads "from here, this".
  const samples = tiers.map((r) => Math.max(1, r.from_minutes));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical aria-hidden className="size-4 text-muted-foreground" />
          {t("staff.ladderPreviewTitle", "Try the ladder")}
        </CardTitle>
        <CardDescription>
          {t("staff.ladderPreviewHint", "An example only: payroll uses each person's own salary and shift. Minutes late count from the end of the shift's grace.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="preview-late">{t("staff.previewLate", "Minutes late")}</Label>
            <DurationField id="preview-late" unit="min" max={1440} value={late} onChange={setLate} presets={[5, 20, 45, 90]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preview-salary">{t("staff.previewSalary", "Example monthly salary")}</Label>
            <MoneyField id="preview-salary" stepPounds={500} value={example.salary} onChange={(p) => p !== null && Number.isFinite(p) && onExample({ ...example, salary: p })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preview-shift">{t("staff.previewShift", "Shift length")}</Label>
            <DurationField id="preview-shift" unit="h" min={1} max={24} value={example.shiftMinutes / 60}
              onChange={(h) => h !== null && Number.isFinite(h) && h >= 1 && onExample({ ...example, shiftMinutes: Math.round(h * 60) })} />
          </div>
        </div>

        <p role="status" aria-live="polite" className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
          <span className="font-medium tabular-nums">{t("staff.previewLateN", { n: minutes, defaultValue: `Late ${minutes} min` })}</span>
          <ArrowRight aria-hidden className="size-4 text-muted-foreground rtl:rotate-180" />
          {minutes <= 0 ? (
            <span>{t("staff.previewOnTime", "on time: nothing is docked")}</span>
          ) : tier ? (
            <span>
              {t("staff.previewRung", { n: index + 1, defaultValue: `rung ${index + 1}` })}
              {": "}
              <span className="font-semibold tabular-nums">{t("staff.previewDocks", { amount: fmtMoney(amount), defaultValue: `docks ${fmtMoney(amount)}` })}</span>
            </span>
          ) : (
            <span>{t("staff.previewNoRung", "no rung covers this, so nothing is docked")}</span>
          )}
        </p>

        {tiers.length ? (
          <ul className="divide-y rounded-lg border text-sm">
            {samples.map((m, i) => {
              const r = selectTier(tiers, m);
              return (
                <li key={i} className={cn("flex items-center justify-between gap-3 px-3 py-2", i === index && "bg-primary/5")}>
                  <span className="tabular-nums text-muted-foreground">
                    {tiers[i].to_minutes === null
                      ? t("staff.tierFromOnly", "{{from}}+ min late", { from: tiers[i].from_minutes })
                      : t("staff.tierRange", "{{from}}–{{to}} min late", { from: tiers[i].from_minutes, to: tiers[i].to_minutes })}
                  </span>
                  <span className="font-medium tabular-nums">{r ? fmtMoney(tierPiastres(r, example)) : "—"}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
