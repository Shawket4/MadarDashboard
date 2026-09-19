/* eslint-disable */
// @ts-nocheck

/**
 * One recorded staff drink, as every reader sees it.
 */
export interface StaffDrink {
  allowance_at_record: number;
  branch_id: string;
  business_date: string;
  /** @nullable */
  cost_minor?: number | null;
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
