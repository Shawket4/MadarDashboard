/* eslint-disable */
// @ts-nocheck

export interface BranchDeliverySettings {
  branch_id: string;
  /** @nullable */
  in_mall_close_time?: string | null;
  /**
     * Optional discount applied to each channel's item subtotal (reuses the
   * org `discounts` table). Frozen onto the order at intake. `null` = none.
     * @nullable
     */
  in_mall_discount_id?: string | null;
  in_mall_enabled: boolean;
  in_mall_fee: number;
  /** @nullable */
  in_mall_open_time?: string | null;
  in_mall_override: string;
  /** @nullable */
  max_road_distance_meters?: number | null;
  /** @nullable */
  outside_close_time?: string | null;
  /** @nullable */
  outside_discount_id?: string | null;
  outside_enabled: boolean;
  /** @nullable */
  outside_open_time?: string | null;
  outside_override: string;
  prep_time_minutes: number;
}
