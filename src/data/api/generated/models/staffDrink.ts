/* eslint-disable */
// @ts-nocheck

/**
 * One recorded staff drink, as every reader sees it.
 */
export interface StaffDrink {
  allowance_at_record: number;
  branch_id: string;
  business_date: string;
  /**
     * What the pool comped on the sale's line, minor units, as the SERVER
     * prices it. `null` on a record-only drink (no priced line behind it).
     * @nullable
     */
  comp_minor?: number | null;
  /**
     * What the TILL said the comp was, on a replayed sale. Differs from
     * `comp_minor` exactly when `orders.staff_drink.record:comp_mismatch` was
     * flagged.
     * @nullable
     */
  comp_minor_reported?: number | null;
  /** @nullable */
  cost_minor?: number | null;
  /**
     * What that line was still charged: a bigger size, extras, pricier picks.
     * @nullable
     */
  extras_minor?: number | null;
  id: string;
  item_name: string;
  /** @nullable */
  menu_item_id?: string | null;
  note: string;
  /** @nullable */
  order_id?: string | null;
  /** Past the allowance, as the SERVER recounted it. */
  overspent: boolean;
  /** The server made it an overspend and the till had not. */
  overspent_on_replay: boolean;
  quantity: number;
  recorded_at: string;
  /** @nullable */
  recorded_by?: string | null;
  /** @nullable */
  size_label?: string | null;
  used_before: number;
}
