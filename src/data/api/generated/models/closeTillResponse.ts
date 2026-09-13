/* eslint-disable */
// @ts-nocheck
import type { LastTillWarning } from './lastTillWarning';
import type { Till } from './till';
import type { TillReconciliationLine } from './tillReconciliationLine';

export interface CloseTillResponse {
  last_till_warning?: null | LastTillWarning;
  reconciliation: TillReconciliationLine[];
  till: Till;
}
