/* eslint-disable */
// @ts-nocheck

export interface PurchaseOrder {
  branch_id: string;
  created_at: string;
  created_by: string;
  /** @nullable */
  expected_at?: string | null;
  id: string;
  /** @nullable */
  note?: string | null;
  org_id: string;
  /** @nullable */
  received_at?: string | null;
  /** @nullable */
  received_by?: string | null;
  /** @nullable */
  reference?: string | null;
  status: string;
  /** @nullable */
  supplier_id?: string | null;
  /** @nullable */
  supplier_name?: string | null;
  updated_at: string;
}
