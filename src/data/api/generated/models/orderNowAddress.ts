/* eslint-disable */
// @ts-nocheck
import type { CustomerAddress } from './customerAddress';

export type OrderNowAddress = CustomerAddress & ({
  /** True when it can no longer be delivered to from the last branch. */
  stale: boolean;
  /**
     * `out_of_zone` | `zone_unavailable` | `branch_unavailable`.
     * @nullable
     */
  stale_reason?: string | null;
});
