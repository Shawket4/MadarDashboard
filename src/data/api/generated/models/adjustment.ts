/* eslint-disable */
// @ts-nocheck

export interface Adjustment {
  /** @nullable */
  amount_piastres?: number | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  effective_date: string;
  /** @nullable */
  ends_on?: string | null;
  id: string;
  /** `bonus` · `deduction` */
  kind: string;
  /** @nullable */
  percent_of_base?: number | null;
  reason: string;
  recurring: boolean;
  source: string;
  /** `pending` (waits for the owner) · `approved` · `rejected` */
  status: string;
  user_id: string;
  user_name: string;
}
