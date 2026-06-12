/* eslint-disable */
// @ts-nocheck
import type { PrinterBrand } from './printerBrand';

/**
 * PATCH-style update. Fields fall into three categories:
 *
 * - **Absent** from JSON → keep existing value.
 * - **Present as `null`** (only the `printer_*` fields) → clear the column.
 * - **Present as a value** → set to that value.
 *
 * OpenAPI cannot express the absent-vs-null distinction cleanly, so all
 * fields are documented as optional and nullable. Clients targeting this
 * endpoint should send only the fields they want to change.
 */
export interface UpdateBranchRequest {
  /** @nullable */
  address?: string | null;
  /** @nullable */
  geo_radius_meters?: number | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  latitude?: number | null;
  /** @nullable */
  longitude?: number | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  phone?: string | null;
  printer_brand?: null | PrinterBrand;
  /** @nullable */
  printer_ip?: string | null;
  /** @nullable */
  printer_port?: number | null;
  /** @nullable */
  timezone?: string | null;
}
