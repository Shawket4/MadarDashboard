/* eslint-disable */
// @ts-nocheck

export interface ChannelAddonOverrideInput {
  addon_item_id: string;
  branch_id: string;
  channel: string;
  /** @nullable */
  is_available?: boolean | null;
  /** @nullable */
  price_override?: number | null;
}
