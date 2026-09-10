/* eslint-disable */
// @ts-nocheck
import type { TaxPolicyPublic } from './taxPolicyPublic';
import type { UserPublic } from './userPublic';

export interface LoginResponse {
  currency_code: string;
  /**
     * Every dine-in sale belongs to a table.
     *
     * The till needs this, not just the server: the rule changes what the POS
     * puts in front of a teller — the floor becomes the home screen and a sale
     * starts by picking a table — and a refusal AFTER the items are rung up is
     * far too late to be useful.
     */
  require_table_for_orders?: boolean;
  /**
     * The full policy, including tax-inclusive pricing and service charge.
     * Prefer this over the flat `tax_rate` above.
     */
  tax_policy: TaxPolicyPublic;
  /**
     * Org tax rate as a decimal (e.g. 0.14 = 14% VAT); 0.0 when no org. Mirrors
     * /auth/me so the POS has it immediately after login.
     */
  tax_rate: number;
  /** JWT to send as `Authorization: Bearer <token>` on subsequent requests. */
  token: string;
  user: UserPublic;
}
