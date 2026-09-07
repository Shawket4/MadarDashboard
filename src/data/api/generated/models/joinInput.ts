/* eslint-disable */
// @ts-nocheck

export interface JoinInput {
  branch_id: string;
  /**
     * Device-trust token from `/public/otp/verify`. Required only when the
     * branch's `require_otp` is on.
     * @nullable
     */
  device_token?: string | null;
  /**
     * 'en' or 'ar' — the language the pass is written in.
     * @nullable
     */
  locale?: string | null;
  name: string;
  phone: string;
}
