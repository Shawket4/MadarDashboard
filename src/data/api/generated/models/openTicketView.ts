/* eslint-disable */
// @ts-nocheck
import type { OpenTicketItemView } from './openTicketItemView';
import type { TicketBill } from './ticketBill';

export interface OpenTicketView {
  /**
     * The bill as the SERVER prices it — see [`TicketBill`]. This is the
     * figure the till shows and the drawer collects, because it is the figure
     * the settle will book; `subtotal` above is only its first line.
     */
  bill?: TicketBill;
  /**
     * The booking this ticket seated, if the party had one.
     * @nullable
     */
  booking_id?: string | null;
  branch_id: string;
  /** @nullable */
  customer_name?: string | null;
  /**
     * The discount the waiter put on the bill at fire time, if any. Shown so
     * the cashier can SEE what a settle will inherit — and clear it with an
     * explicit `discount_type: "none"` rather than have it applied silently.
     * @nullable
     */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  /** @nullable */
  discount_value?: number | null;
  /** @nullable */
  guest_count?: number | null;
  id: string;
  items: OpenTicketItemView[];
  /** @nullable */
  notes?: string | null;
  opened_at: string;
  opened_by: string;
  /** @nullable */
  opened_by_name?: string | null;
  /** @nullable */
  order_id?: string | null;
  /**
     * The kitchen has plated every line of every round. DERIVED from the
     * ticket's `kitchen_tickets` at read time, so it is always what the KDS
     * says now. `false` for a ticket nothing was ever fired to the kitchen for
     * (routing mode `off`): there is nothing to be ready.
     */
  ready?: boolean;
  /**
     * The last moment the kitchen had the whole ticket plated. History for
     * the timing reports; `ready` is the live fact.
     * @nullable
     */
  ready_at?: string | null;
  /** @nullable */
  settled_at?: string | null;
  /** The bill: `open`, `settled` or `voided`. Never `ready` — see [`Self::ready`]. */
  status: string;
  subtotal: number;
  /** @nullable */
  table_id?: string | null;
  /** @nullable */
  ticket_ref?: string | null;
  /** @nullable */
  void_note?: string | null;
  /**
     * Categorised like an order void, so void-rate reports read dine-in and
     * counter alike.
     * @nullable
     */
  void_reason?: string | null;
  /** @nullable */
  voided_at?: string | null;
}
