/**
 * The Rules page's form model (RU-1, RU-2): the values the page edits, the
 * Zod schema that checks them, and what a save sends.
 *
 * The business saves every rule in one PUT. A branch saves only the rules it
 * changed (they become its overrides) plus `inherit`, the rules it hands back
 * to the business; the server merges branch over business field by field and
 * says which fields a branch sets itself (`overridden`). Nothing here decides
 * a figure: the server validates again and prices from what it stored.
 */
import { z } from "zod";
import type { TFunction } from "i18next";

import type { AttendanceSettings, PutAttendanceSettingsRequest } from "@/data/api/generated/models";
import { DEFAULT_RULES, rulesFrom, rulesRequest, type DawamRules } from "@/features/dawam/rules-card";

/** One rung of the late-penalty ladder, in the shape the API stores. */
export interface Tier {
  from_minutes: number;
  to_minutes: number | null;
  kind: "minutes" | "piastres" | "day_fraction";
  value: number;
}

export interface RulesValues {
  tiers: Tier[];
  absenceDays: string;
  workingDays: string;
  autoBuffer: string;
  excusedPaid: boolean;
  dawam: DawamRules;
}

/** Settings a branch can't override: the business's alone (server: 400). */
export const BUSINESS_ONLY = ["period_start_day", "advance_cap_percent", "gender_mode"] as const;

/** The wire's rule names → the label the page shows for them. */
export const RULE_LABELS: Record<string, [string, string]> = {
  late_deduction_tiers: ["staff.lateLadder", "Late arrival penalties"],
  absence_deduction_days: ["staff.absenceDays", "Days docked per absence"],
  default_overtime_multiplier: ["staff.otMultiplierLegacy", "Old overtime multiplier"],
  auto_checkout_buffer_minutes: ["staff.autoBuffer", "Auto-close after (min)"],
  working_days_per_month: ["staff.workingDays", "Working days per month"],
  excused_time_paid_default: ["staff.excusedPaid", "Approved permissions are paid"],
  overtime_mode: ["dawam.overtime", "Overtime"],
  overtime_day_multiplier: ["dawam.otDay", "Day rate ×"],
  overtime_night_multiplier: ["dawam.otNight", "Night rate ×"],
  holiday_multiplier: ["dawam.holidayRate", "Holiday rate ×"],
  half_day_leave_counts: ["dawam.halfDayLeave", "Half-day leave counts as"],
  night_start: ["dawam.nightStart", "Night starts"],
  night_end: ["dawam.nightEnd", "Night ends"],
  limit_day_hours: ["dawam.limitDay", "Hours a day"],
  limit_week_hours: ["dawam.limitWeek", "Hours a week"],
  limit_presence_hours: ["dawam.limitPresence", "Presence a day"],
  limit_rest_hours: ["dawam.limitRest", "Rest between shifts"],
  limit_overtime_day_hours: ["dawam.limitOtDay", "Overtime a day"],
  orders_per_staff: ["dawam.ordersPerStaff", "Orders an hour per person"],
  cover_pay_mode: ["dawam.coverPay", "Cover pay"],
  // Business-only settings: never a branch chip, but a refusal can name them.
  advance_cap_percent: ["dawam.advanceCap", "Advance cap (% of salary)"],
  period_start_day: ["dawam.periodStartDay", "Pay period starts on day"],
  gender_mode: ["dawam.genderTitle", "Gender in suggestions"],
};

export const ruleLabel = (name: string, t: TFunction) => {
  const [key, fallback] = RULE_LABELS[name] ?? [name, name];
  return key === name ? name : t(key, fallback);
};

export const EMPTY_VALUES: RulesValues = {
  tiers: [],
  absenceDays: "1",
  workingDays: "30",
  autoBuffer: "120",
  excusedPaid: true,
  dawam: DEFAULT_RULES,
};

/**
 * The form's values from the server's settings. A business that never saved
 * its rules starts from the server's suggested ladder (RU-1); a branch always
 * shows what it effectively runs on.
 */
export function valuesFrom(s: AttendanceSettings, opts: { suggest?: boolean } = {}): RulesValues {
  const stored = (s.late_deduction_tiers as Tier[] | undefined) ?? [];
  const suggested = (s.suggested_tiers ?? []) as Tier[];
  const tiers = opts.suggest && !s.rules_saved_at && stored.length === 0 ? suggested : stored;
  return {
    // One key order for every rung (the schema's), whatever the server sent.
    tiers: tiers.map((x) => ({ from_minutes: x.from_minutes, to_minutes: x.to_minutes ?? null, kind: x.kind, value: Number(x.value) })),
    absenceDays: String(s.absence_deduction_days ?? 1),
    workingDays: String(s.working_days_per_month ?? 30),
    autoBuffer: String(s.auto_checkout_buffer_minutes ?? 120),
    excusedPaid: s.excused_time_paid_default ?? true,
    dawam: rulesFrom(s),
  };
}

/**
 * The same non-overlap rule the server enforces in `rules::validate_tiers`,
 * checked here too so the operator sees the problem on the row they edit.
 * Returns an i18n key and its values, or null.
 */
export function tierProblem(tiers: Tier[]): { key: string; fallback: string; n?: number } | null {
  const sorted = [...tiers].sort((a, b) => a.from_minutes - b.from_minutes);
  let previousEnd: number | null = null;
  for (const tier of sorted) {
    if (!Number.isFinite(tier.from_minutes) || tier.from_minutes < 0) {
      return { key: "staff.tierNegative", fallback: "Minutes cannot be negative" };
    }
    if (tier.to_minutes !== null && tier.to_minutes < tier.from_minutes) {
      return { key: "staff.tierInverted", fallback: "A rung cannot end before it starts" };
    }
    if (!Number.isFinite(tier.value) || tier.value < 0) {
      return { key: "staff.tierNegativeValue", fallback: "A penalty cannot be negative" };
    }
    if (previousEnd !== null && tier.from_minutes <= previousEnd) {
      return { key: "staff.tierOverlap", fallback: "Rungs overlap at {{n}} minutes", n: tier.from_minutes };
    }
    previousEnd = tier.to_minutes ?? Number.MAX_SAFE_INTEGER;
  }
  return null;
}

/** The form's schema; messages are translated, so it is built per render language. */
export function rulesSchema(t: TFunction) {
  const tier = z.object({
    from_minutes: z.number(),
    to_minutes: z.number().nullable(),
    kind: z.enum(["minutes", "piastres", "day_fraction"]),
    value: z.number(),
  });
  return z
    .object({
      tiers: z.array(tier),
      absenceDays: z.string(),
      workingDays: z.string(),
      autoBuffer: z.string(),
      excusedPaid: z.boolean(),
      dawam: z.custom<DawamRules>(),
    })
    .superRefine((v, ctx) => {
      const p = tierProblem(v.tiers);
      if (p) ctx.addIssue({ code: "custom", path: ["tiers"], message: t(p.key, p.fallback, { n: p.n }) });
      const num = (s: string) => (s.trim() === "" ? NaN : Number(s));
      if (!(num(v.workingDays) > 0)) {
        ctx.addIssue({ code: "custom", path: ["workingDays"], message: t("staff.workingDaysPositive", "Working days must be more than 0") });
      }
      if (!(num(v.absenceDays) >= 0)) {
        ctx.addIssue({ code: "custom", path: ["absenceDays"], message: t("staff.absenceDaysRange", "Days docked can't be negative") });
      }
      const buffer = num(v.autoBuffer);
      if (!(Number.isInteger(buffer) && buffer >= 0)) {
        ctx.addIssue({ code: "custom", path: ["autoBuffer"], message: t("staff.autoBufferRange", "Auto-close needs whole minutes, 0 or more") });
      }
      const dawam = rulesRequest(v.dawam, true);
      if ("error" in dawam) ctx.addIssue({ code: "custom", path: ["dawam"], message: t(dawam.error) });
    });
}

/** Every rule the form holds, as the PUT names them. Assumes valid values. */
export function fullBody(v: RulesValues, canGender: boolean): PutAttendanceSettingsRequest {
  const dawam = rulesRequest(v.dawam, canGender);
  if ("error" in dawam) throw new Error(dawam.error);
  return {
    ...dawam.ok,
    late_deduction_tiers: v.tiers,
    absence_deduction_days: Number(v.absenceDays),
    working_days_per_month: Number(v.workingDays),
    auto_checkout_buffer_minutes: Number(v.autoBuffer),
    excused_time_paid_default: v.excusedPaid,
  } as PutAttendanceSettingsRequest;
}

/** Key order never matters: `{a, b}` and `{b, a}` are the same rule. */
const canonical = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical((v as Record<string, unknown>)[k])]))
      : v;
const same = (a: unknown, b: unknown) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

/**
 * A branch's save: only the rules that differ from what the branch runs on
 * now (each one becomes an override), never a business-only setting, and the
 * rules handed back to the business. `force` names rules the branch makes its
 * own even at the value it runs on now (it picked it explicitly, D5). Null
 * when there is nothing to send.
 */
export function branchBody(
  branchId: string,
  v: RulesValues,
  loaded: RulesValues,
  inherit: readonly string[],
  force: readonly string[] = [],
): PutAttendanceSettingsRequest | null {
  const now = fullBody(v, false) as Record<string, unknown>;
  const before = fullBody(loaded, false) as Record<string, unknown>;
  const body: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(now)) {
    if ((BUSINESS_ONLY as readonly string[]).includes(k) || inherit.includes(k)) continue;
    if (!same(val, before[k]) || force.includes(k)) body[k] = val;
  }
  if (Object.keys(body).length === 0 && inherit.length === 0) return null;
  return {
    ...(body as PutAttendanceSettingsRequest),
    branch_id: branchId,
    ...(inherit.length ? { inherit: [...inherit] } : {}),
  };
}
