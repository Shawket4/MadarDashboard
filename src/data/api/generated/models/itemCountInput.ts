/* eslint-disable */
// @ts-nocheck

export interface ItemCountInput {
  /**
     * The figure counted. `null` un-counts the line: its figure, reason and
     * counter are cleared and finalize treats it as not counted. Required
     * (omitting it is refused), so no client un-counts by accident.
     * @nullable
     */
  counted_qty: number | null;
  /** @nullable */
  note?: string | null;
  org_ingredient_id: string;
  /**
     * Why the count differs from book stock. One of: theft | spoilage |
     * breakage | miscount | supplier_short | transfer_error | other. Required
     * at finalize for rows whose difference exceeds the org's threshold.
     * @nullable
     */
  variance_reason?: string | null;
}
