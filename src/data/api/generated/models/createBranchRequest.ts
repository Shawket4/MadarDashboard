/* eslint-disable */
// @ts-nocheck
import type { PrinterBrand } from './printerBrand';

export interface CreateBranchRequest {
  /** @nullable */
  address?: string | null;
  /**
     * Geofence radius in meters. Defaults to 200.
     * @nullable
     */
  geo_radius_meters?: number | null;
  /** @nullable */
  latitude?: number | null;
  /** @nullable */
  longitude?: number | null;
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
     * IANA timezone name. If absent, the branch inherits the org's timezone.
     * @nullable
     */
  timezone?: string | null;
}
