/* eslint-disable */
// @ts-nocheck
import type { KitchenComboTag } from './kitchenComboTag';

/**
 * A slim kitchen display line (NO prices) — what the cook reads. Built from an
 * order item or a ticket round line by the caller.
 */
export interface KitchenLine {
  combo?: null | KitchenComboTag;
  /** @nullable */
  menu_item_id?: string | null;
  modifiers?: string[];
  name: string;
  /** @nullable */
  notes?: string | null;
  qty: number;
  /** @nullable */
  size_label?: string | null;
}
