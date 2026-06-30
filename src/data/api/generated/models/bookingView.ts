/* eslint-disable */
// @ts-nocheck

export interface BookingView {
  /** @nullable */
  arrived_at?: string | null;
  branch_id: string;
  /** @nullable */
  cancelled_at?: string | null;
  /** @nullable */
  completed_at?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  /** @nullable */
  customer_lat?: number | null;
  /** @nullable */
  customer_lng?: number | null;
  customer_name: string;
  customer_phone: string;
  id: string;
  kind: string;
  /** @nullable */
  no_show_at?: string | null;
  /** @nullable */
  notes?: string | null;
  /** @nullable */
  notified_at?: string | null;
  org_id: string;
  otp_verified: boolean;
  party_size: number;
  /** @nullable */
  quoted_ready_at?: string | null;
  /** @nullable */
  reserved_for?: string | null;
  /** @nullable */
  seated_at?: string | null;
  source: string;
  status: string;
  /** Assigned table ids (multiple ⇒ merged tables). */
  table_ids: string[];
  updated_at: string;
}
