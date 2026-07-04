/* eslint-disable */
// @ts-nocheck
import type { UserPublic } from './userPublic';

export interface LoginResponse {
  currency_code: string;
  /**
     * Org tax rate as a decimal (e.g. 0.14 = 14% VAT); 0.0 when no org. Mirrors
     * /auth/me so the POS has it immediately after login.
     */
  tax_rate: number;
  /** JWT to send as `Authorization: Bearer <token>` on subsequent requests. */
  token: string;
  user: UserPublic;
}
