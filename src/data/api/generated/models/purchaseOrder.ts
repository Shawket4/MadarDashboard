/* eslint-disable */
// @ts-nocheck

export interface PurchaseOrder {
  branch_id: string;
  /**
     * Branch label — populated by the order lists so the "All branches" view
     * can show which branch each PO belongs to; other endpoints leave it null.
     * @nullable
     */
  branch_name?: string | null;
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
