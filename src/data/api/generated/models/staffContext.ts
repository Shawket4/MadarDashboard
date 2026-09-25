/* eslint-disable */
// @ts-nocheck
import type { ContextBranch } from './contextBranch';
import type { ContextPerson } from './contextPerson';
import type { ContextSettings } from './contextSettings';
import type { WorkShiftBrief } from './workShiftBrief';

export interface StaffContext {
  /**
     * My ceiling on a bonus before it waits for the owner; null = none.
     * @nullable
     */
  adjustment_limit_piastres?: number | null;
  /**
     * My ceiling on an advance, as whole percent of the person's salary owed
     * after it (the grant stores basis points); null = none.
     * @nullable
     */
  advance_limit_percent?: number | null;
  branches: ContextBranch[];
  /**
     * The HR capabilities I hold (`hr.*` keys) — through my Madar account;
     * empty for an employee with none. The app gates tabs on these (PM-4).
     */
  caps: string[];
  /**
     * The capabilities I hold at EVERY branch: the list `GET /authz/me`
     * puts in `everywhere`, for the business-wide acts (the rules, payroll,
     * public holidays: `hr.rules.edit`, D3). Empty without a Madar account.
     */
  caps_everywhere: string[];
  /**
     * My ceiling on a deduction (AD-5: separate from the bonus limit).
     * @nullable
     */
  deduction_limit_piastres?: number | null;
  /** Who is signed in: the employee. */
  employee_id: string;
  /** The org's modules (`pos`, `dawam`); POS on means till punches (CL-13). */
  modules: string[];
  name: string;
  org_id: string;
  org_name: string;
  people: ContextPerson[];
  /**
     * When THIS phone accepted the location notice; null = show it before
     * any location is taken (AT-5). A new phone, or a restored session on
     * one that never accepted, starts null.
     * @nullable
     */
  privacy_accepted_at?: string | null;
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
