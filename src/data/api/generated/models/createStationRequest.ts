/* eslint-disable */
// @ts-nocheck
import type { PrinterBrand } from './printerBrand';

export interface CreateStationRequest {
  branch_id: string;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  is_default?: boolean | null;
  name: string;
  printer_brand?: null | PrinterBrand;
  /** @nullable */
  printer_ip?: string | null;
  /** @nullable */
  printer_port?: number | null;
  /** @nullable */
  sort_order?: number | null;
}
