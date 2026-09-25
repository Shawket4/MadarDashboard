/**
 * The quick salary calculator beside a monthly salary field (owner decision
 * 9): type the monthly salary, a day rate or an hourly rate and the other
 * two follow, from the rules' working days per month and day length (26 days
 * of 8 hours unless the rules say otherwise). With a hire date it also names
 * the first pay, pro rata by calendar days (PAY-13). Only the monthly figure
 * is saved; the other two are a reading of it.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetAttendanceSettings } from "@/data/api/generated/api";
import { fmtDate, fmtMoney } from "@/lib/format";
import { readPounds } from "./money-dialogs";
import { DEFAULT_BASIS, firstPay, rates, type PayBasis } from "./salary-calc";

/** Piastres → what an EGP input shows ("250", "31.25"). */
const egp = (p: number) => String(p / 100);

export function SalaryCalculator({
  id, label, monthly, onMonthly, hireDate, placeholder, onlyOpenPeriod = false,
}: {
  /** The monthly input's id (its label points at it). */
  id: string;
  label: string;
  /** The monthly salary as typed, in EGP. */
  monthly: string;
  onMonthly: (egpText: string) => void;
  /** Names the first pay when given. */
  hireDate?: string;
  placeholder?: string;
  /** Name the first pay only while that period hasn't ended (an existing employee). */
  onlyOpenPeriod?: boolean;
}) {
  const { t } = useTranslation();
  const settingsQ = useGetAttendanceSettings({}, { query: { staleTime: 60_000 } });
  const s = settingsQ.data;
  const basis: PayBasis = {
    workingDays: s?.working_days_per_month || DEFAULT_BASIS.workingDays,
    dayMinutes: s?.limit_day_hours ? Math.round(s.limit_day_hours * 60) : DEFAULT_BASIS.dayMinutes,
  };
  const startDay = s?.period_start_day || 1;
  // What was typed into the day or hour box, kept as typed while it is the source.
  const [typed, setTyped] = useState<{ which: "daily" | "hourly"; text: string } | null>(null);

  const m = readPounds(monthly);
  const r = m !== null ? rates({ monthly: m }, basis) : null;
  const dailyText = typed?.which === "daily" ? typed.text : r ? egp(r.daily) : "";
  const hourlyText = typed?.which === "hourly" ? typed.text : r ? egp(r.hourly) : "";

  const fromRate = (which: "daily" | "hourly", text: string) => {
    setTyped({ which, text });
    const p = readPounds(text);
    if (p === null) return onMonthly("");
    onMonthly(egp(rates(which === "daily" ? { daily: p } : { hourly: p }, basis).monthly));
  };

  const first = m !== null && hireDate && /^\d{4}-\d{2}-\d{2}$/.test(hireDate) ? firstPay(m, hireDate, startDay) : null;
  const showFirst = first && (!onlyOpenPeriod || first.to >= new Date().toISOString().slice(0, 10));
  const hours = basis.dayMinutes / 60;

  return (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
        <div className="space-y-1">
          <Label htmlFor={id}>{label}</Label>
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            dir="ltr"
            placeholder={placeholder}
            value={monthly}
            onChange={(e) => {
              setTyped(null);
              onMonthly(e.target.value);
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-daily`}>{t("dawam.dailyRateEgp", "Daily rate (EGP)")}</Label>
          <Input id={`${id}-daily`} type="number" inputMode="decimal" step="0.01" min="0" dir="ltr" value={dailyText} onChange={(e) => fromRate("daily", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-hourly`}>{t("dawam.hourlyRateEgp", "Hourly rate (EGP)")}</Label>
          <Input id={`${id}-hourly`} type="number" inputMode="decimal" step="0.01" min="0" dir="ltr" value={hourlyText} onChange={(e) => fromRate("hourly", e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("dawam.salaryBasis", { days: basis.workingDays, hours, defaultValue: "From the rules: {{days}} working days of {{hours}} h a month." })}
      </p>
      {showFirst && first ? (
        <p className="text-sm font-medium">
          {t("dawam.firstPay", {
            from: fmtDate(first.from),
            to: fmtDate(first.to),
            amount: fmtMoney(first.piastres),
            defaultValue: "First pay (from {{from}} to {{to}}): {{amount}}",
          })}
        </p>
      ) : null}
    </div>
  );
}
