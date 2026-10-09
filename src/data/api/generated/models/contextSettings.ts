/* eslint-disable */
// @ts-nocheck

export interface ContextSettings {
  absence_deduction_days: number;
  advance_cap_percent: number;
  holiday_multiplier: number;
  late_deduction_tiers: unknown;
  overtime_day_multiplier: number;
  overtime_mode: string;
  overtime_night_multiplier: number;
  period_start_day: number;
  /** The business saved its rules; nobody clocks in before (RU-1, DSH-6). */
  rules_saved: boolean;
  /**
     * When the rules were first saved; null until then. The sweep never
     * marks absent (or charges) a shift that started before it (B-SETUP-5),
     * so neither does the app (B-ONB-1).
     * @nullable
     */
  rules_saved_at?: string | null;
}
