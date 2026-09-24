/* eslint-disable */
// @ts-nocheck

export interface PlanDevice {
  /**
     * The registered install filling this slot, if any.
     * @nullable
     */
  device_id?: string | null;
  id: string;
  /** `pos` | `waiter` | `kitchen` */
  kind: string;
  name: string;
  /**
     * For a POS or waiter device: the receipt printer its receipts go to.
     * @nullable
     */
  receipt_printer_id?: string | null;
  x: number;
  y: number;
}
