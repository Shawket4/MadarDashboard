/* eslint-disable */
// @ts-nocheck
import type { DealLineInput } from './dealLineInput';

/**
 * An applied deal on an order (the till's teller applied it). Live, the
 * server re-prices it exactly over these units (`409 DEAL_NOT_ELIGIBLE` when
 * they don't satisfy the rule; `orders.deals.apply` required). On replay the
 * till's `discount` is kept and the server's verdict stored beside it.
 */
export interface DealApplicationInput {
  deal_rule_id: string;
  /**
     * Replay only: what the till took off, piastres.
     * @nullable
     */
  discount?: number | null;
  lines: DealLineInput[];
  times: number;
}
