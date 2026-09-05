/* eslint-disable */
// @ts-nocheck

/**
 * What a guest sees on the manage page — no table ids, no staff fields.
 */
export interface PublicBookingView {
  branch_id: string;
  branch_name: string;
  /** Still confirmed and further away than the branch's lead time. */
  can_modify: boolean;
  ends_at: string;
  guest_name: string;
  id: string;
  manage_token: string;
  /** @nullable */
  notes?: string | null;
  party_size: number;
  starts_at: string;
  status: string;
  timezone: string;
}
