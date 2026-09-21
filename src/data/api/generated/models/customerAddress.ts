/* eslint-disable */
// @ts-nocheck

/**
 * A place a customer has had an order sent to.
 */
export interface CustomerAddress {
  /** @nullable */
  address_line?: string | null;
  /**
     * The branch it was last ordered from.
     * @nullable
     */
  branch_id?: string | null;
  /** The channel it was last used with: `in_mall`, `outside` or `umbrella`. */
  channel: string;
  created_at: string;
  customer_id: string;
  /** @nullable */
  delivery_notes?: string | null;
  /** @nullable */
  delivery_zone_id?: string | null;
  /** @nullable */
  floor?: string | null;
  id: string;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  landmark?: string | null;
  last_used_at: string;
  /** @nullable */
  lat?: number | null;
  /** @nullable */
  lng?: number | null;
  /** @nullable */
  place_name?: string | null;
  /** @nullable */
  unit_number?: string | null;
  use_count: number;
}
