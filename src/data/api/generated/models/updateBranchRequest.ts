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
  /**
     * Hours after which an open bill counts as old (1..168).
     * @minimum 1
     * @maximum 168
     * @nullable
     */
  old_bill_hours?: number | null;
  /** @nullable */
  phone?: string | null;
  printer_brand?: null | PrinterBrand;
  /** @nullable */
  printer_ip?: string | null;
  /** @nullable */
  printer_port?: number | null;
  /** @nullable */
  require_table_for_orders?: boolean | null;
  /** @nullable */
  service_charge_rate?: number | null;
  /** @nullable */
  service_charge_taxable?: boolean | null;
  /**
     * Standard opening float in minor units (>= 0); explicit `null` clears it.
     * @minimum 0
     * @nullable
     */
  standard_float?: number | null;
  /** @nullable */
  tax_inclusive?: boolean | null;
  /** @nullable */
  tax_rate?: number | null;
  /** @nullable */
  timezone?: string | null;
}
