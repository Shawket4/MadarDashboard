/* eslint-disable */
// @ts-nocheck
import type { OpenBillsNotice } from './openBillsNotice';
import type { Till } from './till';
import type { TillBrief } from './tillBrief';

export interface TillPreFill {
  has_open_till: boolean;
  /** @nullable */
  last_close_declared?: number | null;
  /**
     * EVERY open till of the person at THIS branch, newest first (whatever the
     * device). Normally zero or one; two or more only after an offline open
     * was replayed while another was open — the newer is flagged
     * (`opened_while_another_open`) and both stay open, so both are listed.
     */
  open_at_branch?: TillBrief[];
  open_bills_notice: OpenBillsNotice;
  open_elsewhere: TillBrief[];
  open_till?: null | Till;
  suggested_opening_cash: number;
}
