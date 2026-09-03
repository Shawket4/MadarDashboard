/* eslint-disable */
// @ts-nocheck

export interface Mission {
  /** @nullable */
  branch_id?: string | null;
  created_at: string;
  /** @nullable */
  decided_at?: string | null;
  /** @nullable */
  decided_by?: string | null;
  /** @nullable */
  decision_note?: string | null;
  /** @nullable */
  description?: string | null;
  ends_at: string;
  id: string;
  /** @nullable */
  location?: string | null;
  org_id: string;
  starts_at: string;
  status: string;
  title: string;
  updated_at: string;
  user_id: string;
  /** @nullable */
  user_name?: string | null;
}
