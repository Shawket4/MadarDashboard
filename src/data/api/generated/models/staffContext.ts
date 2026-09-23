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
  /** The HR capabilities I hold (`hr.*` keys). */
  caps: string[];
  /** The org's modules (`pos`, `dawam`); POS on means till punches (CL-13). */
  modules: string[];
  org_id: string;
  org_name: string;
  people: ContextPerson[];
  /** `owner` · `manager` · `employee` */
  role: string;
  settings: ContextSettings;
  user_id: string;
  work_shifts: WorkShiftBrief[];
}
