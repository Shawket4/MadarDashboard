/* eslint-disable */
// @ts-nocheck
import type { KitchenComboTagNameTranslations } from './kitchenComboTagNameTranslations';

/**
 * The combo a kitchen line belongs to (C12): the KDS groups and tags by it.
 * Old KDS builds ignore it.
 */
export interface KitchenComboTag {
  /** The combo's header line (`order_items.id`, or the ticket line's id). */
  line_id: string;
  name: string;
  name_translations?: KitchenComboTagNameTranslations;
}
