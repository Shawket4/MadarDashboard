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
  employee_id: string;
  /** @nullable */
  employee_name?: string | null;
  id: string;
  installments: number;
  monthly_installment_piastres: number;
  org_id: string;
  /** @nullable */
  reason?: string | null;
  remaining_piastres: number;
  status: string;
  updated_at: string;
}
