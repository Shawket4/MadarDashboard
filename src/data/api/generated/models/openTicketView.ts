/* eslint-disable */
// @ts-nocheck
import type { OpenTicketItemView } from './openTicketItemView';

export interface OpenTicketView {
  branch_id: string;
  /** @nullable */
  customer_name?: string | null;
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
  /** @nullable */
  ready_at?: string | null;
  /** @nullable */
  settled_at?: string | null;
  status: string;
  subtotal: number;
  /** @nullable */
  table_id?: string | null;
  /** @nullable */
  ticket_ref?: string | null;
}
