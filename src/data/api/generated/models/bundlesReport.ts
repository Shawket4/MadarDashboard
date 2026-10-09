/* eslint-disable */
// @ts-nocheck
import type { BundlesRow } from './bundlesRow';
import type { BundlesTotals } from './bundlesTotals';

export interface BundlesReport {
  from: string;
  rows: BundlesRow[];
  to: string;
  totals: BundlesTotals;
}
