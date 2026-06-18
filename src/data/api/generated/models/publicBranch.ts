/* eslint-disable */
// @ts-nocheck

export interface PublicBranch {
  code: string;
  id: string;
  in_mall_enabled: boolean;
  /** Effective-open right now (enabled + open shift + override + window). */
  in_mall_open_now: boolean;
  /** When false, in-mall ordering does not require a device GPS location. */
  in_mall_require_location: boolean;
  name: string;
  /** When false, the public checkout skips OTP verification for this branch. */
  otp_required: boolean;
  outside_enabled: boolean;
  outside_open_now: boolean;
}
