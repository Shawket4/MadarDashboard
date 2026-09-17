/* eslint-disable */
// @ts-nocheck

export interface TillSpotView {
  /** @nullable */
  approval_id?: string | null;
  /** @nullable */
  approved_by?: string | null;
  /** @nullable */
  approved_by_name?: string | null;
  branch_id: string;
  created_at: string;
  /** @nullable */
  device_id?: string | null;
  id: string;
  printed: boolean;
  /** @nullable */
  printed_at?: string | null;
  till_id: string;
  viewed_at: string;
  viewed_by: string;
  viewed_by_name: string;
}
