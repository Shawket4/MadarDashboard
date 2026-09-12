/* eslint-disable */
// @ts-nocheck
import type { PublicTableRound } from './publicTableRound';

/**
 * What the table has ordered so far.
 *
 * The page draws this above the menu, so a customer who scans halfway through
 * a meal sees what is already on their bill rather than an empty basket that
 * looks like a fresh start. It is also how the second, third and fourth
 * person at the table see each other's rounds.
 *
 * Public and unauthenticated, like everything else here. Whoever can read the
 * code stuck to the table can see what that table ordered — which is the
 * people sitting at it.
 */
export interface PublicTableBill {
  /**
     * When the party's bill was opened. The page counts up from this; a
     * duration computed here would be wrong by the time it arrived.
     */
  opened_at: string;
  /** The kitchen has finished everything fired so far. */
  ready: boolean;
  /** Every round fired, oldest first, with what went to the kitchen in each. */
  rounds: PublicTableRound[];
  /** Lines as charged, before discount — the bill's first line, not the bill. */
  subtotal: number;
  ticket_id: string;
  /**
     * What the table will be asked to pay, as the SERVER prices it: the
     * discount, the service charge and the tax are all in here, and none of
     * them is something this page should be recomputing.
     */
  total: number;
}
