/* eslint-disable */
// @ts-nocheck

export interface ManualRecordRequest {
  branch_id: string;
  business_date: string;
  /** @nullable */
  check_in_at?: string | null;
  /** @nullable */
  check_out_at?: string | null;
  /** @nullable */
  notes?: string | null;
  /** Required: a hand-written attendance row always says why it exists. */
  reason: string;
  /**
     * Force a status instead of deriving one — the only way to record an
     * `absent` or `on_leave` day by hand.
     * @nullable
     */
  status?: string | null;
  user_id: string;
  /** @nullable */
  work_shift_id?: string | null;
}
