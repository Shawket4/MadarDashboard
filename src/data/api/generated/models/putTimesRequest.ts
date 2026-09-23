/* eslint-disable */
// @ts-nocheck

export interface PutTimesRequest {
  employee_id: string;
  /** @nullable */
  end_time?: string | null;
  on_date: string;
  /**
     * Both, or neither to go back to the block's own times.
     * @nullable
     */
  start_time?: string | null;
  work_shift_id: string;
}
