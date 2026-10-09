/* eslint-disable */
// @ts-nocheck
import type { DealLineInput } from './dealLineInput';
import type { QuotedDealNameTranslations } from './quotedDealNameTranslations';

/**
 * A deal the server applied to the cart.
 */
export interface QuotedDeal {
  deal_rule_id: string;
  discount: number;
  lines: DealLineInput[];
  name: string;
  name_translations: QuotedDealNameTranslations;
  times: number;
}
