/* eslint-disable */
// @ts-nocheck
import type { OrderItemInput } from './orderItemInput';
import type { PaymentSplitInput } from './paymentSplitInput';

export interface CreateOrderRequest {
  /** @nullable */
  amount_tendered?: number | null;
  branch_id: string;
  /** @nullable */
  created_at?: string | null;
  /** @nullable */
  customer_name?: string | null;
  /** @nullable */
  discount_id?: string | null;
  /** @nullable */
  discount_type?: string | null;
  /** @nullable */
  discount_value?: number | null;
  items: OrderItemInput[];
  /** @nullable */
  notes?: string | null;
  payment_method: string;
  /** @nullable */
  payment_splits?: PaymentSplitInput[] | null;
  shift_id: string;
  /** @nullable */
  tip_amount?: number | null;
  /** @nullable */
  tip_payment_method?: string | null;
}
