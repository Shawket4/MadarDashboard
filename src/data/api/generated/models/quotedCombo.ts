/* eslint-disable */
// @ts-nocheck
import type { QuotedComboPart } from './quotedComboPart';

export interface QuotedCombo {
  parts: QuotedComboPart[];
  /** P per combo unit. */
  price: number;
  /** À la carte value of one combo minus `unit_total` (may be ≤ 0). */
  saving_unit: number;
  /** One combo with its surcharges and add-ons. */
  unit_total: number;
}
