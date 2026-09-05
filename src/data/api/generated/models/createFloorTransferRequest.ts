/* eslint-disable */
// @ts-nocheck

/**
 * Operational table-state edit from the POS: the layout (geometry/shape) is
 * dashboard-authored, but STATE — status walks (bussing a dirty table) and
 * which zone the physical table currently sits in — belongs to the floor
 * staff. Both fields optional; `clear_section` moves the table out of every
 * section (`section_id` wins when both are sent).
 */
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
