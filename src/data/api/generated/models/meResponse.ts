/* eslint-disable */
// @ts-nocheck
import type { UserPublic } from './userPublic';

export interface MeResponse {
  /** Org currency code (e.g. "EGP"). */
  currency_code: string;
  /** Org tax rate as a decimal (e.g. 0.14 = 14% VAT); 0.0 when the user has no
   * org. Exposed so the POS can compute a tax-inclusive cart total client-side. */
  tax_rate: number;
  user: UserPublic;
}
