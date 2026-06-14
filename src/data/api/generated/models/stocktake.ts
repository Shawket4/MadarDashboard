/* eslint-disable */
// @ts-nocheck

export interface Stocktake {
  branch_id: string;
  /**
     * Branch label — only populated by the stocktakes list (so the "All
   * branches" view can show which branch each stocktake belongs to). Other
   * stocktake endpoints leave it `null`.
     * @nullable
     */
  branch_name?: string | null;
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
