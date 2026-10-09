/* eslint-disable */
// @ts-nocheck

/**
 * A registered install at the branch, for showing which slot it fills and
 * when it was last heard from.
 */
export interface PlanRegisteredDevice {
  /** @nullable */
  app_version?: string | null;
  code: string;
  id: string;
  /** `pos` | `kds` | `waiter` */
  kind: string;
  /** @nullable */
  label?: string | null;
  last_seen_at: string;
  /** @nullable */
  platform?: string | null;
}
