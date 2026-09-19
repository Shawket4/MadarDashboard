/* eslint-disable */
// @ts-nocheck

/**
 * The body both the live route and the replay op carry.
 */
export interface RecordStaffDrinkRequest {
  /**
     * What the DEVICE believed the pool stood at. Kept for the owner to
     * compare against what the server recomputed; never trusted.
     * @nullable
     */
  allowance_at_record?: number | null;
  branch_id: string;
  /** @nullable */
  cost_minor?: number | null;
  /** @nullable */
  device_id?: string | null;
  /**
     * Client-minted, and the idempotency key: replaying the same drink twice
     * is the same row, not a second one off the allowance.
     */
  id: string;
  /**
     * Frozen at the till, so a later rename never rewrites history.
     * @nullable
     */
  item_name?: string | null;
  menu_item_id: string;
  /** REQUIRED. Who the drink is for and why, in the teller's own words. */
  note: string;
  /**
     * The zero-priced sale this drink rang as, when there is one.
     * @nullable
     */
  order_id?: string | null;
  /** @nullable */
  overspent?: boolean | null;
  quantity?: number;
  /**
     * When the teller rang it. Defaults to now; the business day is derived
     * from this in the BRANCH's timezone, never from the server's clock date.
     * @nullable
     */
  recorded_at?: string | null;
  /** @nullable */
  size_label?: string | null;
  /** @nullable */
  till_id?: string | null;
  /** @nullable */
  used_before?: number | null;
}
