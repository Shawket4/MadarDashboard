/* eslint-disable */
// @ts-nocheck

export interface ChannelOverrideInput {
  branch_id: string;
  channel: string;
  /** @nullable */
  is_available?: boolean | null;
  menu_item_id: string;
  /** @nullable */
  price_override?: number | null;
}
