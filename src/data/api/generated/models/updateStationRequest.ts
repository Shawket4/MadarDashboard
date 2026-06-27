/* eslint-disable */
// @ts-nocheck
import type { PrinterBrand } from './printerBrand';

export interface UpdateStationRequest {
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  is_default?: boolean | null;
  /** @nullable */
  name?: string | null;
  printer_brand?: null | PrinterBrand;
  /** @nullable */
  printer_ip?: string | null;
  /** @nullable */
  printer_port?: number | null;
  /** @nullable */
  sort_order?: number | null;
}
