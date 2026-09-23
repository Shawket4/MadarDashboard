/* eslint-disable */
// @ts-nocheck
import type { ProvisionBranch } from './provisionBranch';
import type { ProvisionOwner } from './provisionOwner';

export interface ProvisionOrgRequest {
  branch: ProvisionBranch;
  /** @nullable */
  currency_code?: string | null;
  /**
     * `pos`, `dawam`; default POS only — Dawam is switched on per org. A
     * Dawam-only customer is `["dawam"]` (SA-1).
     * @nullable
     */
  modules?: string[] | null;
  name: string;
  owner: ProvisionOwner;
  slug: string;
  /**
     * A FRACTION (0.14 = 14%). Default 0 (locked decision).
     * @nullable
     */
  tax_rate?: number | null;
  /** `restaurant` or `cafe`. */
  template: string;
  /** @nullable */
  timezone?: string | null;
}
