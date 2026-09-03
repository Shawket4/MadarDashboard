/* eslint-disable */
// @ts-nocheck

export interface CreateLatePassRequest {
  expected_arrival_time: string;
  on_date: string;
  /** @nullable */
  reason?: string | null;
  /** @nullable */
  user_id?: string | null;
}
