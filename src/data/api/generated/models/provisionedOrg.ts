/* eslint-disable */
// @ts-nocheck
import type { Org } from './org';

export interface ProvisionedOrg {
  branch_id: string;
  org: Org;
  owner_id: string;
  template: string;
}
