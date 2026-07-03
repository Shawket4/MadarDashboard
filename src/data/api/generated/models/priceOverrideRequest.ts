/* eslint-disable */
// @ts-nocheck

export interface PriceOverrideRequest {
  /** @nullable */
  branch_id?: string | null;
  /**
     * delivery_channel: 'in_mall' | 'outside' | 'umbrella' | 'pickup'.
     * @nullable
     */
  channel?: string | null;
  /** @nullable */
  is_available?: boolean | null;
  /** @nullable */
  price?: number | null;
  /** 'branch' | 'channel' | 'branch_channel'. */
  scope: string;
  target_id: string;
  /** 'menu_item_size' | 'modifier_option'. */
  target_type: string;
}
