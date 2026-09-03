/* eslint-disable */
// @ts-nocheck

export interface PayrollPeriod {
  /** @nullable */
  closed_at?: string | null;
  created_at: string;
  employee_count: number;
  end_date: string;
  /** @nullable */
  generated_at?: string | null;
  /** @nullable */
  generated_by?: string | null;
  id: string;
  name: string;
  org_id: string;
  /** @nullable */
  paid_at?: string | null;
  start_date: string;
  status: string;
  total_net_piastres: number;
  updated_at: string;
}
