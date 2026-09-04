/* eslint-disable */
// @ts-nocheck

export interface TransferView {
  branch_id: string;
  created_at: string;
  /** @nullable */
  from_table_id?: string | null;
  /** @nullable */
  fulfilled_table_id?: string | null;
  id: string;
  /** @nullable */
  note?: string | null;
  occupant_id: string;
  /** `held_order` | `open_ticket`. */
  occupant_kind: string;
  /**
     * Display label for the queue: the held order's name / the ticket's ref.
     * @nullable
     */
  occupant_label?: string | null;
  /** @nullable */
  requested_by?: string | null;
  /** @nullable */
  resolved_at?: string | null;
  /** `waiting` | `fulfilled` | `cancelled`. */
  status: string;
  /** @nullable */
  target_section_id?: string | null;
  /** @nullable */
  target_table_id?: string | null;
  updated_at: string;
}
