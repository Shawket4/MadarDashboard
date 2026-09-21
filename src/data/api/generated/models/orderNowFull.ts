/* eslint-disable */
// @ts-nocheck
import type { OrderNowAddress } from './orderNowAddress';
import type { OrderNowBranch } from './orderNowBranch';

/**
 * Everything a verified device gets. Absent from the masked context.
 */
export interface OrderNowFull {
  /** Most recently used first. */
  addresses: OrderNowAddress[];
  customer_id: string;
  last_branch?: null | OrderNowBranch;
  /**
     * `cash` | `card`, as they last said.
     * @nullable
     */
  last_payment_hint?: string | null;
  locale: string;
  name: string;
  /** Canonical (`2010…`). */
  phone: string;
}
