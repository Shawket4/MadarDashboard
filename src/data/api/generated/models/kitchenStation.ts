/* eslint-disable */
// @ts-nocheck
import type { PrinterBrand } from './printerBrand';

export interface KitchenStation {
  branch_id: string;
  created_at: string;
  id: string;
  is_active: boolean;
  is_default: boolean;
  name: string;
  name_translations: unknown;
  org_id: string;
  printer_brand?: null | PrinterBrand;
  /** @nullable */
  printer_ip?: string | null;
  /** @nullable */
  printer_port?: number | null;
  sort_order: number;
  updated_at: string;
}
