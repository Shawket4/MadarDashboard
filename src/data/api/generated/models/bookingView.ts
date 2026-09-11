/* eslint-disable */
// @ts-nocheck

export interface BookingView {
  branch_id: string;
  /** @nullable */
  cancel_reason?: string | null;
  /** @nullable */
  cancelled_at?: string | null;
  /** @nullable */
  cancelled_by?: string | null;
  /** @nullable */
  completed_at?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  ends_at: string;
  guest_name: string;
  guest_phone: string;
  /**
     * The floor shows the claimed tables as held from here (branch
     * `hold_minutes` before the start). Clients compare with their clock.
     */
  held_from: string;
  id: string;
  locale: string;
  /** Active but holding no table: the host must assign one. */
  needs_table: boolean;
  /** @nullable */
  no_show_at?: string | null;
  /** @nullable */
  notes?: string | null;
  /**
     * The ticket this party is (or was) eating on. DERIVED from
     * `open_tickets.booking_id` — the live one if there is one, else the
     * latest — never stored on the booking.
     * @nullable
     */
  open_ticket_id?: string | null;
  party_size: number;
  phone_verified: boolean;
  /** @nullable */
  reminder_sent_at?: string | null;
  /** @nullable */
  seated_at?: string | null;
  /** @nullable */
  section_id?: string | null;
  /** `public` | `host`. */
  source: string;
  starts_at: string;
  /** `confirmed` | `seated` | `completed` | `no_show` | `cancelled`. */
  status: string;
  table_ids: string[];
  table_labels: string[];
  updated_at: string;
}
