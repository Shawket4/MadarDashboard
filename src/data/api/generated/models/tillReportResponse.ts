/* eslint-disable */
// @ts-nocheck
import type { OrderNumberRange } from './orderNumberRange';
import type { Till } from './till';
import type { TillReconciliationLine } from './tillReconciliationLine';
import type { TillReportFigures } from './tillReportFigures';

export type TillReportResponse = TillReportFigures & ({
  /** @nullable */
  old_bills_at_close?: number | null;
  /** @nullable */
  open_bills_at_close?: number | null;
  order_number_range: OrderNumberRange;
  reconciliation: TillReconciliationLine[];
  till: Till;
});
