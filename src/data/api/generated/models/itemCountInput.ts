/* eslint-disable */
// @ts-nocheck

export interface ItemCountInput {
  counted_qty: number;
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  /**
     * Why the count differs from expected. One of: theft | spoilage | breakage |
   * miscount | supplier_short | transfer_error | other. Required at finalize for
   * rows whose difference exceeds the org's variance threshold.
     * @nullable
     */
  variance_reason?: string | null;
}
