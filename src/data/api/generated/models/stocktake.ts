/* eslint-disable */
// @ts-nocheck

export interface Stocktake {
  branch_id: string;
  created_at: string;
  /** @nullable */
  finalized_at?: string | null;
  /** @nullable */
  finalized_by?: string | null;
  id: string;
  /** @nullable */
  note?: string | null;
  org_id: string;
  started_at: string;
  started_by: string;
  /** @nullable */
  started_by_name?: string | null;
  status: string;
}
