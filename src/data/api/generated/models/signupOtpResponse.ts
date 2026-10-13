/* eslint-disable */
// @ts-nocheck

export interface SignupOtpResponse {
  /** How long the code is good for. */
  expires_in_seconds: number;
  /** How long before another code may be asked for. */
  resend_after_seconds: number;
  sent: boolean;
}
