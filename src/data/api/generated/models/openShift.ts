/* eslint-disable */
// @ts-nocheck

export interface OpenShift {
  branch_id: string;
  /**
     * The employee who claimed it.
     * @nullable
     */
  claimed_by?: string | null;
  /** @nullable */
  claimed_by_name?: string | null;
  /** @nullable */
  end_at?: string | null;
  id: string;
  on_date: string;
  shift_name: string;
  /** @nullable */
  start_at?: string | null;
  /** `open` · `claimed` · `filled` · `cancelled` */
  status: string;
  work_shift_id: string;
}
