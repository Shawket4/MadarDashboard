/* eslint-disable */
// @ts-nocheck
import type { QuotedCombo } from './quotedCombo';

export interface QuotedLine {
  combo?: null | QuotedCombo;
  /** What the applied deals took off this line. */
  deal_minor: number;
  /** Index into the request's `items[]`. */
  index: number;
  /** The whole line with its add-ons, before deals. */
  line_total: number;
  quantity: number;
  /** The size price per unit (a combo: 0; see `combo`). */
  unit_price: number;
}
