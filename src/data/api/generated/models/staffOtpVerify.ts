/* eslint-disable */
// @ts-nocheck

export interface StaffOtpVerify {
  code: string;
  /** @nullable */
  model?: string | null;
  /**
     * The business to sign in to, when the number works at more than one (RO-5).
     * @nullable
     */
  org_id?: string | null;
  phone: string;
  /** @nullable */
  platform?: string | null;
}
