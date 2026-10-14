/* eslint-disable */
// @ts-nocheck

export interface SignupVerifyResponse {
  /** How long it is good for. */
  expires_in_seconds: number;
  /** Send it with `POST /public/signup`. Single use. */
  signup_token: string;
}
