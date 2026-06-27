/* eslint-disable */
// @ts-nocheck
import type { KitchenTicketItemView } from './kitchenTicketItemView';

/**
 * One fire event projected for the kitchen (a round or a counter order).
 */
export interface KitchenTicketView {
  branch_id: string;
  created_at: string;
  id: string;
  items: KitchenTicketItemView[];
  /** @nullable */
  kitchen_ref?: string | null;
  round_number: number;
  source_id: string;
  source_type: string;
  status: string;
  /** @nullable */
  table_label?: string | null;
}
