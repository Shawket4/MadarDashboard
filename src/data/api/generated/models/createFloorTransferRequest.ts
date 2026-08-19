/* eslint-disable */
// @ts-nocheck

export interface CreateFloorTransferRequest {
  branch_id: string;
  /** Client-minted id (offline-first identity; retries dedup on it). */
  id: string;
  /** @nullable */
  note?: string | null;
  occupant_id: string;
  /** `held_order` | `open_ticket`. */
  occupant_kind: string;
  /**
     * The wish: any table in this section…
     * @nullable
     */
  target_section_id?: string | null;
  /**
     * …or exactly this table. At least one of the two is required.
     * @nullable
     */
  target_table_id?: string | null;
}
