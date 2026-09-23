/* eslint-disable */
// @ts-nocheck
import type { ContextBranch } from './contextBranch';
import type { ContextPerson } from './contextPerson';
import type { ContextSettings } from './contextSettings';
import type { WorkShiftBrief } from './workShiftBrief';

export interface StaffContext {
  /**
     * My ceiling on a bonus/deduction before it waits for the owner; null = none.
     * @nullable
     */
  adjustment_limit_piastres?: number | null;
  /** @nullable */
  advance_limit_percent?: number | null;
  branches: ContextBranch[];
  /**
     * The HR capabilities I hold (`hr.*` keys) — through my Madar account;
     * empty for an employee with none. The app gates tabs on these (PM-4).
     */
  caps: string[];
  /** Who is signed in: the employee. */
  employee_id: string;
  /** The org's modules (`pos`, `dawam`); POS on means till punches (CL-13). */
  modules: string[];
  name: string;
  org_id: string;
  org_name: string;
  people: ContextPerson[];
  /** `owner` · `manager` · `employee` */
  role: string;
  settings: ContextSettings;
  /**
     * Their Madar account, when they have one; manager acts go through it.
     * @nullable
     */
  user_id?: string | null;
  work_shifts: WorkShiftBrief[];
}
