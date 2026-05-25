/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PrinterBrand } from './printerBrand';

export interface CreateBranchRequest {
  /** @nullable */
  address?: string | null;
  name: string;
  org_id: string;
  /** @nullable */
  phone?: string | null;
  printer_brand?: null | PrinterBrand;
  /** @nullable */
  printer_ip?: string | null;
  /**
     * TCP port for the receipt printer. Defaults to `9100` if absent.
     * @nullable
     */
  printer_port?: number | null;
  /**
     * IANA timezone name. Defaults to `Africa/Cairo` if absent.
     * @nullable
     */
  timezone?: string | null;
}
