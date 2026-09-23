/* eslint-disable */
// @ts-nocheck

export interface WorkShiftBrief {
  /** @nullable */
  branch_id?: string | null;
  crosses_midnight: boolean;
  end_time: string;
  grace_minutes: number;
  id: string;
  name: string;
  start_time: string;
}
