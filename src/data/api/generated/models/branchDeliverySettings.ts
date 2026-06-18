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
  /** When false, in-mall orders may be placed without a device GPS location
   * ("confirm you're at the branch"). Shop/company + floor + unit are always
   * required regardless. Default true. */
  in_mall_require_location: boolean;
  /** @nullable */
  max_road_distance_meters?: number | null;
  /** When false, the public checkout skips OTP phone verification for this
   * branch and accepts orders without a device token. Default true. */
  otp_required: boolean;
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
