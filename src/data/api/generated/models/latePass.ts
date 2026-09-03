/* eslint-disable */
// @ts-nocheck

export interface LatePass {
  created_at: string;
  /** @nullable */
  decided_at?: string | null;
  /** @nullable */
  decided_by?: string | null;
  /** @nullable */
  decision_note?: string | null;
  expected_arrival_time: string;
  id: string;
  on_date: string;
  org_id: string;
  /** @nullable */
  reason?: string | null;
  status: string;
  updated_at: string;
  user_id: string;
  /** @nullable */
  user_name?: string | null;
}
