/* eslint-disable */
// @ts-nocheck
import type { OpenBillsNotice } from './openBillsNotice';
import type { Till } from './till';
import type { TillBrief } from './tillBrief';

export interface TillPreFill {
  has_open_till: boolean;
  /** @nullable */
  last_close_declared?: number | null;
  open_bills_notice: OpenBillsNotice;
  open_elsewhere: TillBrief[];
  open_till?: null | Till;
  suggested_opening_cash: number;
}
