/* eslint-disable */
// @ts-nocheck
import type { KitchenTicketItemView } from './kitchenTicketItemView';

/**
 * One fire event projected for the kitchen (a round or a counter order).
 */
export interface KitchenTicketView {
  branch_id: string;
  /**
     * `bumped`, `settled`, `voided` or `retired` — see [`CloseReason`].
     * @nullable
     */
  close_reason?: string | null;
  /**
     * When the ticket left the kitchen's attention for good; `null` while it
     * is live. A till queue that shows history renders closed tickets greyed;
     * the KDS feed never returns them.
     * @nullable
     */
  closed_at?: string | null;
  created_at: string;
  id: string;
  items: KitchenTicketItemView[];
  /** @nullable */
  kitchen_ref?: string | null;
  round_number: number;
  source_id: string;
  source_type: string;
  /** The state of the cooking: `firing`, `ready`, `voided`. */
  status: string;
  /** @nullable */
  table_label?: string | null;
}
