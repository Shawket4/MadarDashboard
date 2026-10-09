/**
 * What a rule would charge, worked out the way the server does it, for the
 * Rules page's "try it" preview. Mirrors `MadarRust/src/staff/rules.rs`:
 * `select_late_tier` (the FIRST rung whose range holds the minutes) and
 * `late_deduction_piastres` over `PayRates` (multiply before dividing, then
 * round half away from zero). A preview only: payroll prices from what the
 * server stored, never from this.
 */
import type { RulesValues, Tier } from "./rules-form";
import { fullBody } from "./rules-form";

export interface PayExample {
  /** Monthly salary, piastres. */
  salary: number;
  workingDays: number;
  /** The shift's scheduled minutes a day (the minute-rate divisor). */
  shiftMinutes: number;
}

/** The rung `lateMinutes` falls on, or null (on time, or past a ladder that stops). */
export function selectTier(tiers: Tier[], lateMinutes: number): Tier | null {
  if (lateMinutes <= 0) return null;
  return tiers.find((t) => lateMinutes >= Math.max(0, t.from_minutes) && (t.to_minutes === null || lateMinutes <= t.to_minutes)) ?? null;
}

const roundHalfAway = (x: number) => Math.sign(x) * Math.round(Math.abs(x));

/** What a rung costs in piastres for one pay example. */
export function tierPiastres(tier: Tier, ex: PayExample): number {
  if (tier.kind === "piastres") return Math.max(0, roundHalfAway(tier.value));
  if (ex.workingDays <= 0) return 0;
  if (tier.kind === "day_fraction") return Math.max(0, roundHalfAway((ex.salary * tier.value) / ex.workingDays));
  if (ex.shiftMinutes <= 0) return 0;
  return Math.max(0, roundHalfAway((ex.salary * tier.value) / (ex.workingDays * ex.shiftMinutes)));
}

/** One day's pay for the example (what an absence of 1 day docks). */
export const dayPiastres = (ex: PayExample, days = 1): number =>
  ex.workingDays > 0 ? Math.max(0, roundHalfAway((ex.salary * days) / ex.workingDays)) : 0;

/** Key order never matters when comparing two rule values. */
const canonical = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical((v as Record<string, unknown>)[k])]))
      : v;

export interface RuleChange {
  name: string;
  before: unknown;
  after: unknown;
}

/**
 * Which saved rules a save would change, by their wire names, for the
 * "you're about to change…" confirmation. Invalid values yield no list (the
 * form refuses them before it asks).
 */
export function changedRules(now: RulesValues, before: RulesValues, canGender: boolean): RuleChange[] {
  let a: Record<string, unknown>;
  let b: Record<string, unknown>;
  try {
    a = fullBody(now, canGender) as Record<string, unknown>;
    b = fullBody(before, canGender) as Record<string, unknown>;
  } catch {
    return [];
  }
  return Object.keys(a)
    .filter((k) => JSON.stringify(canonical(a[k])) !== JSON.stringify(canonical(b[k])))
    .map((k) => ({ name: k, before: b[k], after: a[k] }));
}
