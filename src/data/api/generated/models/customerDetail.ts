/* eslint-disable */
// @ts-nocheck
import type { Customer } from './customer';
import type { CustomerOrder } from './customerOrder';

export interface CustomerDetail {
  customer: Customer;
  /** Customers merged into this one. */
  merged_from: string[];
  recent_orders: CustomerOrder[];
  /**
     * Set when the id asked for was merged: the id that was asked for.
     * @nullable
     */
  resolved_from?: string | null;
}
