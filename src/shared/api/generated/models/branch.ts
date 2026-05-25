/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { PrinterBrand } from './printerBrand';

export interface Branch {
  /** @nullable */
  address?: string | null;
  created_at: string;
  id: string;
  is_active: boolean;
  name: string;
  org_id: string;
  /**
     * Convenience field — populated from the parent org's `logo_url`.
     * @nullable
     */
  org_logo_url?: string | null;
  /** @nullable */
  phone?: string | null;
  printer_brand?: null | PrinterBrand;
  /** @nullable */
  printer_ip?: string | null;
  /** @nullable */
  printer_port?: number | null;
  /** IANA timezone name. Defaults to `Africa/Cairo`. */
  timezone: string;
  updated_at: string;
}
