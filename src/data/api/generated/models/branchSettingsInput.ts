/* eslint-disable */
// @ts-nocheck

export interface BranchSettingsInput {
  branch_id: string;
  /** @nullable */
  in_mall_close_time?: string | null;
  /**
     * Optional per-channel discount ids (must be active discounts in the
   * caller's org). `null` clears the channel's discount.
     * @nullable
     */
  in_mall_discount_id?: string | null;
  in_mall_enabled: boolean;
  in_mall_fee: number;
  /** @nullable */
  in_mall_open_time?: string | null;
  /** @nullable */
  max_road_distance_meters?: number | null;
  /** @nullable */
  outside_close_time?: string | null;
  /** @nullable */
  outside_discount_id?: string | null;
  outside_enabled: boolean;
  /** @nullable */
  outside_open_time?: string | null;
  prep_time_minutes: number;
}
