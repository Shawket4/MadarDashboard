/* eslint-disable */
// @ts-nocheck
import type { ReadinessCheck } from './readinessCheck';

export interface Readiness {
  /** Blocking checks first, then advice. Empty for an org without the POS. */
  checks: ReadinessCheck[];
  /** @nullable */
  first_order_at?: string | null;
  /** The shop has taken an order. */
  live: boolean;
  org_id: string;
  /** Every blocking check passes: a cashier can ring up and take payment. */
  ready: boolean;
}
