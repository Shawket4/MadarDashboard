/* eslint-disable */
// @ts-nocheck
import type { OrderDealLine } from './orderDealLine';
import type { OrderDealNameTranslations } from './orderDealNameTranslations';

/**
 * An applied deal as stored: `OrderFull.deals[]`.
 */
export interface OrderDeal {
  deal_rule_id: string;
  /** What came off the lines (the till's figure on a replay). */
  discount: number;
  /**
     * The server's verdict; equals `discount` live; `null` when not computable.
     * @nullable
     */
  discount_server?: number | null;
  id: string;
  lines: OrderDealLine[];
  name: string;
  name_translations: OrderDealNameTranslations;
  times: number;
}
