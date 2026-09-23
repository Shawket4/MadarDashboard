/* eslint-disable */
// @ts-nocheck

export interface Swap {
  created_at: string;
  id: string;
  peer_date: string;
  peer_id: string;
  peer_name: string;
  peer_shift_id: string;
  peer_shift_name: string;
  requester_date: string;
  requester_id: string;
  requester_name: string;
  requester_shift_id: string;
  requester_shift_name: string;
  /** `awaiting_peer` · `pending` · `approved` · `rejected` · `cancelled` */
  status: string;
}
