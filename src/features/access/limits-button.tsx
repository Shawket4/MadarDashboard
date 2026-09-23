/**
 * The limits on one capability (phase 5): a money ceiling, a percent ceiling,
 * a stock-value ceiling, "only their own" and "within N minutes". Over a limit
 * the till asks a manager (when the capability allows approval) instead of
 * refusing. Money is typed in pounds and stored in minor units; percent is
 * typed in % and stored in basis points.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import type { LimitsView } from "@/data/api/generated/models";
import type { CapabilityMeta } from "@/generated/capabilities";

type NumKey = "max_amount" | "max_percent" | "max_value" | "max_age_minutes";
const SCALE: Record<NumKey, number> = { max_amount: 100, max_percent: 100, max_value: 100, max_age_minutes: 1 };

/** Stored → typed ("5000" minor → "50"). */
export function toDraft(k: NumKey, v: number | null | undefined): string {
  return v == null ? "" : String(v / SCALE[k]);
}

/** Typed → stored ("50" → 5000); empty is no limit. */
export function fromDraft(k: NumKey, s: string): number | null {
  const n = Number(s);
  return s.trim() === "" || !Number.isFinite(n) ? null : Math.round(n * SCALE[k]);
}

export function hasLimits(v: LimitsView | null | undefined): boolean {
  return !!v && (v.own === true || (["max_amount", "max_percent", "max_value", "max_age_minutes"] as NumKey[]).some((k) => v[k] != null));
}

/**
 * What happens above the limit, for this capability: the till asks a manager
 * (POS), the act waits for someone with a higher limit (a Dawam money act with
 * remote approval, e.g. a manager's deductions), or it is refused.
 */
function overLimitHint(meta: CapabilityMeta, t: TFunction): string {
  if (meta.pos) return t("access.overLimitHint", "Over a limit, the till asks a manager.");
  if (meta.approval) return t("access.overLimitWaits", "Over the limit, it waits for someone with a higher limit, usually the owner.");
  return t("access.overLimitRefused", "Over the limit, it is refused.");
}

export function LimitsButton({
  meta,
  value,
  disabled,
  onSave,
}: {
  meta: CapabilityMeta;
  value: LimitsView | null;
  disabled: boolean;
  onSave: (l: LimitsView) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [own, setOwn] = useState(false);
  // Controlled so a save closes it: the label turning "Limited" is the feedback.
  const [open, setOpen] = useState(false);
  const label: Record<NumKey, string> = {
    max_amount: t("access.maxAmount", "Most per action (EGP)"),
    max_percent: t("access.maxPercent", "Most per action (%)"),
    max_value: t("access.maxValue", "Most per action"),
    max_age_minutes: t("access.maxAgeMinutes", "Within minutes of the sale"),
  };
  const numeric = meta.limits.filter((k): k is NumKey => k !== "own");
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) return;
        setDraft(Object.fromEntries(numeric.map((k) => [k, toDraft(k, value?.[k])])));
        setOwn(value?.own === true);
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          {hasLimits(value) ? t("access.limited", "Limited") : t("access.limit", "Limit")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3">
        {meta.limits.includes("own") ? (
          <Label className="flex items-center justify-between gap-2 font-normal">
            <span className="text-sm">{t("access.ownOnly", "Only their own")}</span>
            <Switch checked={own} onCheckedChange={setOwn} />
          </Label>
        ) : null}
        {numeric.map((k) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={`limit-${meta.key}-${k}`}>{label[k]}</Label>
            <Input
              id={`limit-${meta.key}-${k}`}
              inputMode="decimal"
              value={draft[k] ?? ""}
              placeholder={t("access.noLimit", "No limit")}
              onChange={(e) => setDraft((p) => ({ ...p, [k]: e.target.value.replace(/[^0-9.]/g, "") }))}
            />
          </div>
        ))}
        <p className="text-xs text-muted-foreground">{overLimitHint(meta, t)}</p>
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            onSave({
              ...Object.fromEntries(numeric.map((k) => [k, fromDraft(k, draft[k] ?? "")])),
              ...(meta.limits.includes("own") ? { own } : {}),
            } as LimitsView);
            setOpen(false);
          }}
        >
          {t("common.save", "Save")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
