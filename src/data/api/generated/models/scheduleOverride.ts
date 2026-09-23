/* eslint-disable */
// @ts-nocheck
import type { LabourWarning } from './labourWarning';

export interface ScheduleOverride {
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  employee_id: string;
  /** @nullable */
  end_time?: string | null;
  id: string;
  on_date: string;
  org_id: string;
  /** @nullable */
  reason?: string | null;
  /**
     * This assignment's own from/to, when it has one (the block is unchanged).
     * @nullable
     */
  start_time?: string | null;
  /** Labour limits the person's week now goes past. Warnings, never blocks. */
  warnings?: LabourWarning[];
  /**
     * `None` = an explicit day off.
     * @nullable
     */
  work_shift_id?: string | null;
  /** @nullable */
  work_shift_name?: string | null;
}
