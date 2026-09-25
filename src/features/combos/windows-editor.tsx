/**
 * When a combo or a deal is on sale (C4, §11.3): an optional list of windows,
 * each with its weekdays, hours and dates, for one branch or all of them. No
 * window means always available, and the empty state says exactly that.
 *
 * Controlled (value + onChange) so the combo editor and the deal dialog, two
 * different forms, share it through a `Controller`.
 */
import { useTranslation } from "react-i18next";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

import { DatePicker } from "@/components/app/date-picker";
import { TimePicker } from "@/components/app/time-picker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { emptyWindow, type WindowFormValues } from "./form-schema";
import { ALL_WEEKDAYS, WEEKDAY_BITS, WEEKDAY_KEYS, hasDay, hhmm, toggleDay } from "./util";

const ALL = "__all__";

export interface WindowErrors {
  weekdays?: string;
  ends_at?: string;
  valid_to?: string;
}

export function WindowsEditor({
  value,
  onChange,
  branches,
  errors = [],
  disabled,
  idPrefix,
}: {
  value: WindowFormValues[];
  onChange: (next: WindowFormValues[]) => void;
  branches: { id: string; name: string }[];
  errors?: (WindowErrors | undefined)[];
  disabled?: boolean;
  idPrefix: string;
}) {
  const { t } = useTranslation();
  const patch = (i: number, p: Partial<WindowFormValues>) => onChange(value.map((w, j) => (j === i ? { ...w, ...p } : w)));
  const err = (m?: string) => (m ? t(m) : undefined);

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm">
          <CalendarClock aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-medium">{t("combos.windows.always", "Always available")}</p>
            <p className="text-xs text-muted-foreground">
              {t("combos.windows.alwaysHint", "Add a window to limit it to certain days, hours, dates or one branch.")}
            </p>
          </div>
        </div>
      ) : null}

      {value.map((w, i) => {
        const e = errors[i] ?? {};
        const base = `${idPrefix}-w${i}`;
        return (
          <fieldset key={w.key} disabled={disabled} className="space-y-3 rounded-xl border p-4" aria-labelledby={`${base}-legend`}>
            <div className="flex items-center justify-between gap-2">
              <legend id={`${base}-legend`} className="text-sm font-semibold">
                {t("combos.windows.windowN", { defaultValue: "Window {{n}}", n: i + 1 })}
              </legend>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                aria-label={t("combos.windows.remove", "Remove this window")}
                onClick={() => onChange(value.filter((_, j) => j !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              <p id={`${base}-days`} className="text-xs font-medium text-muted-foreground">
                {t("combos.windows.days", "Days")}
              </p>
              <div role="group" aria-labelledby={`${base}-days`} className="flex flex-wrap gap-1.5">
                {WEEKDAY_BITS.map((d) => {
                  const on = hasDay(w.weekdays, d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => patch(i, { weekdays: toggleDay(w.weekdays, d) })}
                      className={cn(
                        "h-8 min-w-11 rounded-lg border px-2 text-xs font-medium transition-colors duration-150 motion-reduce:transition-none",
                        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60",
                        on ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {t(`combos.windows.day.${WEEKDAY_KEYS[d]}`, WEEKDAY_KEYS[d])}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => patch(i, { weekdays: w.weekdays === ALL_WEEKDAYS ? 0 : ALL_WEEKDAYS })}
                  className="h-8 rounded-lg px-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  {w.weekdays === ALL_WEEKDAYS ? t("combos.windows.clearDays", "Clear") : t("combos.windows.everyDay", "Every day")}
                </button>
              </div>
              {e.weekdays ? (
                <p role="alert" className="text-xs text-destructive">
                  {err(e.weekdays)}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t("combos.windows.hours", "Hours (optional)")}</Label>
                <div className="flex items-center gap-2">
                  <TimePicker
                    value={w.starts_at || null}
                    onChange={(v) => patch(i, { starts_at: hhmm(v) ?? "" })}
                    placeholder={t("combos.windows.from", "From")}
                    triggerClassName="w-full"
                    disabled={disabled}
                  />
                  <TimePicker
                    value={w.ends_at || null}
                    onChange={(v) => patch(i, { ends_at: hhmm(v) ?? "" })}
                    placeholder={t("combos.windows.to", "To")}
                    triggerClassName="w-full"
                    disabled={disabled}
                  />
                </div>
                {e.ends_at ? (
                  <p role="alert" className="text-xs text-destructive">
                    {err(e.ends_at)}
                  </p>
                ) : w.starts_at && w.ends_at && w.ends_at < w.starts_at ? (
                  <p className="text-xs text-muted-foreground">{t("combos.windows.crossesMidnight", "Runs past midnight into the next day.")}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>{t("combos.windows.dates", "Dates (optional)")}</Label>
                <div className="flex items-center gap-2">
                  <DatePicker
                    dateOnly
                    value={w.valid_from || null}
                    onChange={(v: string) => patch(i, { valid_from: v })}
                    placeholder={t("combos.windows.fromDate", "First day")}
                    triggerClassName="w-full"
                    disabled={disabled}
                  />
                  <DatePicker
                    dateOnly
                    value={w.valid_to || null}
                    onChange={(v: string) => patch(i, { valid_to: v })}
                    placeholder={t("combos.windows.toDate", "Last day")}
                    triggerClassName="w-full"
                    disabled={disabled}
                  />
                </div>
                {e.valid_to ? (
                  <p role="alert" className="text-xs text-destructive">
                    {err(e.valid_to)}
                  </p>
                ) : null}
                {(w.valid_from || w.valid_to) && !disabled ? (
                  <button
                    type="button"
                    onClick={() => patch(i, { valid_from: "", valid_to: "" })}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    {t("combos.windows.clearDates", "Clear the dates")}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5 sm:max-w-xs">
              <Label htmlFor={`${base}-branch`}>{t("combos.windows.branch", "Branch")}</Label>
              <Select value={w.branch_id || ALL} onValueChange={(v) => patch(i, { branch_id: v === ALL ? "" : v })} disabled={disabled}>
                <SelectTrigger id={`${base}-branch`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t("combos.windows.allBranches", "All branches")}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </fieldset>
        );
      })}

      {!disabled ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, emptyWindow()])}>
          <Plus className="size-4" /> {t("combos.windows.add", "Add a window")}
        </Button>
      ) : null}
    </div>
  );
}
