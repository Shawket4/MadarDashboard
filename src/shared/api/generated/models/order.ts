/* eslint-disable */
// @ts-nocheck

export interface Order {
  /** @nullable */
  amount_tendered?: number | null;
  branch_id: string;
  /** @nullable */
  change_given?: number | null;
  created_at: string;
  /** @nullable */
  customer_name?: string | null;
  discount_amount: number;
  /** @nullable */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  discount_value: number;
  id: string;
  /** @nullable */
  notes?: string | null;
  order_number: number;
  payment_method: string;
  shift_id: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  teller_id: string;
  teller_name: string;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
  total_amount: number;
  /** @nullable */
  void_reason?: string | null;
  /** @nullable */
  voided_at?: string | null;
  /** @nullable */
  voided_by?: string | null;
}
