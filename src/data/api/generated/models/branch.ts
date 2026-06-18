/* eslint-disable */
// @ts-nocheck
import type { PrinterBrand } from './printerBrand';

export interface Branch {
  /** @nullable */
  address?: string | null;
  created_at: string;
  /**
     * Radius in meters within which this branch is considered a match. Defaults to 200.
     * @nullable
     */
  geo_radius_meters?: number | null;
  id: string;
  is_active: boolean;
  /**
     * WGS-84 latitude for geofenced branch resolution.
     * @nullable
     */
  latitude?: number | null;
  /**
     * WGS-84 longitude for geofenced branch resolution.
     * @nullable
     */
  longitude?: number | null;
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
  /** Effective IANA timezone name for this branch, resolved as
   * `branch.timezone → org.timezone → Africa/Cairo`. Always present;
   * clients should format all of this branch's timestamps in this zone. */
  timezone: string;
  updated_at: string;
}
