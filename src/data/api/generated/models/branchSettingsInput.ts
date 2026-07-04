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
  /**
     * When false, in-mall orders are accepted without a device GPS location.
     * Defaults to true so an omitting client keeps the location check on.
     */
  in_mall_require_location?: boolean;
  /** @nullable */
  max_road_distance_meters?: number | null;
  /**
     * When false, the public checkout skips OTP for this branch. Defaults to
     * true so an omitting client keeps verification on.
     */
  otp_required?: boolean;
  /** @nullable */
  outside_close_time?: string | null;
  /** @nullable */
  outside_discount_id?: string | null;
  outside_enabled: boolean;
  /** @nullable */
  outside_open_time?: string | null;
  /** @nullable */
  pickup_close_time?: string | null;
  /** @nullable */
  pickup_discount_id?: string | null;
  pickup_enabled?: boolean;
  pickup_fee?: number;
  /** @nullable */
  pickup_open_time?: string | null;
  prep_time_minutes: number;
  /** @nullable */
  umbrella_close_time?: string | null;
  /** @nullable */
  umbrella_discount_id?: string | null;
  umbrella_enabled?: boolean;
  umbrella_fee?: number;
  /** @nullable */
  umbrella_open_time?: string | null;
}
