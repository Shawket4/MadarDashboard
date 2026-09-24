/* eslint-disable */
// @ts-nocheck
import type { PrinterBrand } from './printerBrand';

export interface PlanPrinter {
  brand?: null | PrinterBrand;
  /** `network` | `usb` | `bluetooth` */
  connection: string;
  /**
     * For a USB or Bluetooth printer: the device slot it is plugged into.
     * @nullable
     */
  host_device_id?: string | null;
  id: string;
  /** @nullable */
  ip?: string | null;
  name: string;
  paper_mm: number;
  /** @nullable */
  port?: number | null;
  /** `receipt` | `kitchen` */
  role: string;
  x: number;
  y: number;
}
