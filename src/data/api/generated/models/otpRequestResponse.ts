/* eslint-disable */
// @ts-nocheck

export interface OtpRequestResponse {
  /**
     * Only populated when SUFRIX_OTP_DEBUG=1 (dev/test). Never set in prod.
     * @nullable
     */
  debug_code?: string | null;
  sent: boolean;
}
