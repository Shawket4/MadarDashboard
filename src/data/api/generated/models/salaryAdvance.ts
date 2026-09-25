/* eslint-disable */
// @ts-nocheck

export interface SalaryAdvance {
  amount_piastres: number;
  /**
     * The owner's cap on what this person may owe in advances, in piastres
     * (AV-5) — the server's figure, so no client recomputes it. Null for a
     * caller who may not read this person's salary: the cap is half the
     * salary, so it would give it away (owner decision D7). The person
     * always sees their own.
     * @nullable
     */
  cap_piastres?: number | null;
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
  /** What the person owes across their live advances (pending ones count). */
  outstanding_piastres: number;
  /** @nullable */
  reason?: string | null;
  /** Derived from the collection ledger (AV-6). */
  remaining_piastres: number;
  status: string;
  updated_at: string;
  /**
     * What is owed (pending ones counted) is within the cap: what a manager
     * sees instead of the cap (D7). False = over it: only the owner can
     * approve more.
     */
  within_cap: boolean;
}
