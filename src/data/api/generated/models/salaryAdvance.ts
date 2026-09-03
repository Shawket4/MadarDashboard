/* eslint-disable */
// @ts-nocheck

export interface SalaryAdvance {
  amount_piastres: number;
  created_at: string;
  /** @nullable */
  decided_at?: string | null;
  /** @nullable */
  decided_by?: string | null;
  /** @nullable */
  decision_note?: string | null;
  id: string;
  installments: number;
  monthly_installment_piastres: number;
  org_id: string;
  /** @nullable */
  reason?: string | null;
  remaining_piastres: number;
  status: string;
  updated_at: string;
  user_id: string;
  /** @nullable */
  user_name?: string | null;
}
