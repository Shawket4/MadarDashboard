/**
 * What a rule would charge, worked out by the server's own code, for the
 * Rules page's "try it" preview: madar-dawam's ladder (`select_late_tier`, the
 * FIRST rung whose range holds the minutes; `late_deduction_piastres`;
 * `absence_deduction_piastres`) through WebAssembly (`@/lib/rules`);
 * rules-preview.test.ts runs it against the pinned ladder_vectors.json. A
 * preview only: payroll prices from what the server stored, never from this.
 */
import { rules } from "@/lib/rules";

import type { RulesValues, Tier } from "./rules-form";
import { fullBody } from "./rules-form";

export interface PayExample {
  /** Monthly salary, piastres. */
  salary: number;
  workingDays: number;
  /** The shift's scheduled minutes a day (the minute-rate divisor). */
  shiftMinutes: number;
}

// A preview only: a rung still being typed (a number the form will refuse) previews as nothing, never a crashed page.
const orNone = <T>(f: () => T, none: T): T => {
  try {
    return f();
  } catch {
    return none;
  }
};

/** The rung `lateMinutes` falls on, or null (on time, or past a ladder that stops): madar-dawam `select_late_tier`. */
export function selectTier(tiers: Tier[], lateMinutes: number): Tier | null {
  const i = orNone(() => rules.select_late_tier(tiers, lateMinutes), null);
  return i === null ? null : tiers[i];
}

/** What a rung costs in piastres for one pay example: madar-dawam `late_deduction_piastres`. */
export const tierPiastres = (tier: Tier, ex: PayExample): number =>
  orNone(() => rules.late_deduction_piastres(tier, ex.salary, ex.workingDays, ex.shiftMinutes), 0);

/** What an absence docking `days` days costs for the example: madar-dawam `absence_deduction_piastres`. */
export const dayPiastres = (ex: PayExample, days = 1): number =>
  orNone(() => rules.absence_deduction_piastres(ex.salary, ex.workingDays, 1, days), 0);

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
