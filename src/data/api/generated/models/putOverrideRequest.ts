/* eslint-disable */
// @ts-nocheck

export interface PutOverrideRequest {
  employee_id: string;
  /** @nullable */
  end_time?: string | null;
  on_date: string;
  /** @nullable */
  reason?: string | null;
  /**
     * This assignment's own from/to (both or neither).
     * @nullable
     */
  start_time?: string | null;
  /**
     * Omit (or send null) to mark the date an explicit day off. Otherwise the
     * whole date becomes this one shift; `PUT /staff/schedules/days` sets a
     * split day.
     * @nullable
     */
  work_shift_id?: string | null;
}
