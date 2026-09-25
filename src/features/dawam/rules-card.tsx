/**
 * The Dawam rules beside the attendance ladder (RU-7, RU-8, RU-10, AV-5,
 * PAY-1, RQ-8): overtime off / paid automatically / paid when a manager
 * approves, its day and night rates, the public-holiday rate, the cap on
 * outstanding salary advances, the day a pay period starts, and how half-day
 * leave counts; the night window (RU-9), labour limits that warn and never
 * block (RU-13), POS-derived coverage and the owner's gender mode (SC-12),
 * and how a confirmed cover is paid (owner decision D5).
 * Saved with the rest of the page's rules in one request.
 */
import { useTranslation } from "react-i18next";

import { SegmentedControl } from "@/components/app/segmented-control";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AttendanceSettings, PutAttendanceSettingsRequest } from "@/data/api/generated/models";
import { coverPayOf, type CoverPayMode } from "./phase-d";

export interface DawamRules {
  overtimeMode: "off" | "automatic" | "approval";
  otDay: string;
  otNight: string;
  holidayMult: string;
  advanceCap: string;
  periodStartDay: string;
  halfDay: "half_shift" | "whole_day";
  nightStart: string;
  nightEnd: string;
  genderMode: "off" | "soft" | "hard";
  limitDay: string;
  limitWeek: string;
  limitPresence: string;
  limitRest: string;
  limitOtDay: string;
  ordersPerStaff: string;
  coverPayMode: CoverPayMode;
}

type NumKey = "otDay" | "otNight" | "holidayMult" | "advanceCap" | "periodStartDay" | "limitDay" | "limitWeek" | "limitPresence" | "limitRest" | "limitOtDay" | "ordersPerStaff";

/** "22:00:00" → "22:00" for a time input, and back. */
const hhmm = (s: string | undefined, fallback: string) => (s ?? fallback).slice(0, 5);
const hhmmss = (s: string) => (s.length === 5 ? `${s}:00` : s);

export const DEFAULT_RULES: DawamRules = {
  overtimeMode: "off", otDay: "1.35", otNight: "1.70", holidayMult: "2", advanceCap: "50", periodStartDay: "1", halfDay: "half_shift",
  nightStart: "22:00", nightEnd: "06:00", genderMode: "off",
  limitDay: "8", limitWeek: "48", limitPresence: "10", limitRest: "12", limitOtDay: "2", ordersPerStaff: "12",
  coverPayMode: "minute_rate",
};

export const rulesFrom = (s: AttendanceSettings): DawamRules => ({
  overtimeMode: (["off", "automatic", "approval"].includes(s.overtime_mode) ? s.overtime_mode : "off") as DawamRules["overtimeMode"],
  otDay: String(s.overtime_day_multiplier ?? 1.35),
  otNight: String(s.overtime_night_multiplier ?? 1.7),
  holidayMult: String(s.holiday_multiplier ?? 2),
  advanceCap: String(s.advance_cap_percent ?? 50),
  periodStartDay: String(s.period_start_day ?? 1),
  halfDay: s.half_day_leave_counts === "whole_day" ? "whole_day" : "half_shift",
  nightStart: hhmm(s.night_start, "22:00"),
  nightEnd: hhmm(s.night_end, "06:00"),
  genderMode: (["off", "soft", "hard"].includes(s.gender_mode) ? s.gender_mode : "off") as DawamRules["genderMode"],
  limitDay: String(s.limit_day_hours ?? DEFAULT_RULES.limitDay),
  limitWeek: String(s.limit_week_hours ?? DEFAULT_RULES.limitWeek),
  limitPresence: String(s.limit_presence_hours ?? DEFAULT_RULES.limitPresence),
  limitRest: String(s.limit_rest_hours ?? DEFAULT_RULES.limitRest),
  limitOtDay: String(s.limit_overtime_day_hours ?? DEFAULT_RULES.limitOtDay),
  ordersPerStaff: String(s.orders_per_staff ?? DEFAULT_RULES.ordersPerStaff),
  coverPayMode: coverPayOf(s),
});

/**
 * What the form would send, or the first thing wrong with it. The gender mode
 * rides only for someone holding `hr.roster.settings`; anyone else would be
 * refused the whole save for a field they can't change.
 */
export function rulesRequest(r: DawamRules, canGender = false): { ok: PutAttendanceSettingsRequest } | { error: string } {
  const n = (s: string) => Number(s);
  if (!(n(r.otDay) >= 1 && n(r.otNight) >= 1 && n(r.holidayMult) >= 1)) return { error: "dawam.rulesRateLow" };
  if (!(n(r.advanceCap) >= 0 && n(r.advanceCap) <= 100)) return { error: "dawam.rulesCapRange" };
  const day = n(r.periodStartDay);
  if (!(Number.isInteger(day) && day >= 1 && day <= 28)) return { error: "dawam.rulesStartDay" };
  const limits = [r.limitDay, r.limitWeek, r.limitPresence, r.limitRest, r.limitOtDay].map(n);
  if (!limits.every((h) => h > 0 && h <= 168)) return { error: "dawam.rulesLimitRange" };
  const perStaff = n(r.ordersPerStaff);
  if (!(Number.isInteger(perStaff) && perStaff >= 1)) return { error: "dawam.rulesOrdersPerStaff" };
  if (!/^\d{2}:\d{2}/.test(r.nightStart) || !/^\d{2}:\d{2}/.test(r.nightEnd)) return { error: "dawam.rulesNight" };
  return {
    ok: {
      overtime_mode: r.overtimeMode,
      overtime_day_multiplier: n(r.otDay),
      overtime_night_multiplier: n(r.otNight),
      holiday_multiplier: n(r.holidayMult),
      advance_cap_percent: n(r.advanceCap),
      period_start_day: day,
      half_day_leave_counts: r.halfDay,
      night_start: hhmmss(r.nightStart),
      night_end: hhmmss(r.nightEnd),
      limit_day_hours: limits[0],
      limit_week_hours: limits[1],
      limit_presence_hours: limits[2],
      limit_rest_hours: limits[3],
      limit_overtime_day_hours: limits[4],
      orders_per_staff: perStaff,
      cover_pay_mode: r.coverPayMode,
      ...(canGender ? { gender_mode: r.genderMode } : {}),
    },
  };
}

/**
 * `readOnly`: a manager who may see the rules but not change them
 * (`hr.rules.view`). `branch`: a branch's rules, which never carry the
 * business-only settings (the pay period start, the advance cap, gender mode).
 */
export function DawamRulesCard({
  value, onChange, canGender = false, readOnly = false, branch = false, coverFollows, onCoverChoice,
}: {
  value: DawamRules; onChange: (v: DawamRules) => void; canGender?: boolean; readOnly?: boolean; branch?: boolean;
  /** A branch: whether it pays covers the business's way (no override of its own). */
  coverFollows?: boolean;
  /** A branch's choice: follow the business, or a mode of its own. */
  onCoverChoice?: (c: CoverChoice) => void;
}) {
  const { t } = useTranslation();
  const set = <K extends keyof DawamRules>(k: K, v: DawamRules[K]) => onChange({ ...value, [k]: v });
  const num = (k: NumKey, label: string, hint?: string) => (
    <div className="space-y-1">
      <Label htmlFor={`rule-${k}`}>{label}</Label>
      <Input id={`rule-${k}`} type="number" inputMode="decimal" value={value[k]} disabled={readOnly} onChange={(e) => set(k, e.target.value)} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dawam.rulesTitle", "Overtime, holidays and pay")}</CardTitle>
        <CardDescription>{t("dawam.rulesHint", "Overtime is off until you turn it on. Rates follow Egypt's labour law as read so far — check them with your lawyer.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>{t("dawam.overtime", "Overtime")}</Label>
          <SegmentedControl
            value={value.overtimeMode}
            onChange={(v) => set("overtimeMode", v)}
            disabled={readOnly}
            options={[
              { value: "off", label: t("dawam.otOff", "Off") },
              { value: "automatic", label: t("dawam.otAutomatic", "Paid automatically") },
              { value: "approval", label: t("dawam.otApproval", "When a manager approves") },
            ]}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {num("otDay", t("dawam.otDay", "Day rate ×"))}
          {num("otNight", t("dawam.otNight", "Night rate ×"), `${value.nightStart}–${value.nightEnd}`)}
          {num("holidayMult", t("dawam.holidayRate", "Holiday rate ×"))}
        </div>
        {branch ? null : (
          <div className="grid gap-3 sm:grid-cols-2">
            {num("advanceCap", t("dawam.advanceCap", "Advance cap (% of salary)"), t("dawam.advanceCapHint", "Outstanding salary advances above this need the owner."))}
            {num("periodStartDay", t("dawam.periodStartDay", "Pay period starts on day"), t("dawam.periodStartDayHint", "1–28. The 26th means a 26th–25th month."))}
          </div>
        )}
        <div className="space-y-1">
          <Label>{t("dawam.halfDayLeave", "Half-day leave counts as")}</Label>
          <SegmentedControl
            value={value.halfDay}
            onChange={(v) => set("halfDay", v)}
            disabled={readOnly}
            options={[
              { value: "half_shift", label: t("dawam.halfShift", "Half the shift") },
              { value: "whole_day", label: t("dawam.wholeDay", "The whole day") },
            ]}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(["nightStart", "nightEnd"] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={`rule-${k}`}>{k === "nightStart" ? t("dawam.nightStart", "Night starts") : t("dawam.nightEnd", "Night ends")}</Label>
              <Input id={`rule-${k}`} type="time" value={value[k]} disabled={readOnly} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("dawam.nightUnconfirmed", "Night hours for the night rate and for suggestions. Unconfirmed: check them with your lawyer.")}</p>
        <CoverPayChoice
          value={branch && coverFollows ? "business" : value.coverPayMode}
          branch={branch}
          disabled={readOnly}
          onChange={(c) => (branch && onCoverChoice ? onCoverChoice(c) : c !== "business" && set("coverPayMode", c))}
        />
      </CardContent>
      <CardHeader>
        <CardTitle>{t("dawam.limitsTitle", "Labour limits")}</CardTitle>
        <CardDescription>{t("dawam.limitsHint", "In hours. The schedule warns when a roster goes past them and never blocks. Unconfirmed until a lawyer confirms them.")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {num("limitDay", t("dawam.limitDay", "Hours a day"))}
          {num("limitWeek", t("dawam.limitWeek", "Hours a week"))}
          {num("limitPresence", t("dawam.limitPresence", "Presence a day"))}
          {num("limitRest", t("dawam.limitRest", "Rest between shifts"))}
          {num("limitOtDay", t("dawam.limitOtDay", "Overtime a day"))}
          {num("ordersPerStaff", t("dawam.ordersPerStaff", "Orders an hour per person"), t("dawam.ordersPerStaffHint", "Coverage from POS sales: one person for this many orders an hour."))}
        </div>
      </CardContent>
      {branch ? null : (
        <>
          <CardHeader>
            <CardTitle>{t("dawam.genderTitle", "Gender in suggestions")}</CardTitle>
            <CardDescription>{t("dawam.genderHint", "How much the gender default weighs when the schedule suggests people. Only the owner can change it.")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedControl
              value={value.genderMode}
              onChange={(v) => set("genderMode", v)}
              disabled={readOnly || !canGender}
              options={[
                { value: "off", label: t("dawam.genderOff", "Ignore it") },
                { value: "soft", label: t("dawam.genderSoft", "A preference") },
                { value: "hard", label: t("dawam.genderHard", "A rule") },
              ]}
            />
          </CardContent>
        </>
      )}
    </Card>
  );
}

/** A branch's cover-pay choice: the business's way, or its own mode. */
export type CoverChoice = "business" | CoverPayMode;

/**
 * How a confirmed cover is paid (owner decision D5): the coverer's plain
 * minute rate (spec CV-4, the default) or the covered block as a full day.
 * A branch can also follow the business. Each option says what it does.
 */
function CoverPayChoice({
  value, onChange, branch, disabled,
}: {
  value: CoverChoice; onChange: (c: CoverChoice) => void; branch: boolean; disabled: boolean;
}) {
  const { t } = useTranslation();
  const options: { value: CoverChoice; label: string; hint: string }[] = [
    ...(branch
      ? [{
          value: "business" as const,
          label: t("dawam.coverPayBusiness", "Use the business setting"),
          hint: t("dawam.coverPayBusinessHint", "This branch pays covers the way the business does."),
        }]
      : []),
    {
      value: "minute_rate",
      label: t("dawam.coverPayMinute", "The coverer's minute rate"),
      hint: t("dawam.coverPayMinuteHint", "Pay the covered minutes at the coverer's own minute rate (their day rate ÷ 8 hours)."),
    },
    {
      value: "full_block",
      label: t("dawam.coverPayBlock", "A full day for the block"),
      hint: t("dawam.coverPayBlockHint", "Pay a covered block as a full day, however short it is."),
    },
  ];
  return (
    <div className="space-y-2">
      <Label id="cover-pay-label">{t("dawam.coverPay", "Cover pay")}</Label>
      <div role="radiogroup" aria-labelledby="cover-pay-label" className="grid gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg border p-3 text-start transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
              value === o.value ? "border-primary bg-primary/5" : "hover:bg-accent",
            )}
          >
            <span className="block text-sm font-medium">{o.label}</span>
            <span className="block text-xs text-muted-foreground">{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

