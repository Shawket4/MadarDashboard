/* eslint-disable */
// @ts-nocheck
import type { OrderNumberRange } from './orderNumberRange';
import type { Till } from './till';
import type { TillReconciliationLine } from './tillReconciliationLine';
import type { TillReportFigures } from './tillReportFigures';

export type TillReportResponse = TillReportFigures & ({
  /**
     * The branch changefeed horizon read BEFORE the figures (OFFLINE_B_DESIGN
     * §7): every change with `seq <= as_of_seq` is in this report. A device
     * whose cursor has reached it, with nothing of the till still on its way,
     * can take these figures as the authority. `0` when no horizon was
     * available (then it is never newer than any cursor). Additive.
     */
  as_of_seq?: number;
  /**
     * "N held orders left open" at this close (see [`Till`]). Additive.
     * @nullable
     */
  held_orders_left_open?: number | null;
  /** @nullable */
  held_orders_left_open_total?: number | null;
  /** @nullable */
  old_bills_at_close?: number | null;
  /** @nullable */
  open_bills_at_close?: number | null;
  order_number_range: OrderNumberRange;
  reconciliation: TillReconciliationLine[];
  till: Till;
});
