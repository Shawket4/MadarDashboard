/* eslint-disable */
// @ts-nocheck

export interface CreateOrgMultipart {
  /** @nullable */
  currency_code?: string | null;
  /**
     * Logo image file. PNG, JPEG, or WebP. Optional — omit the field
     * entirely to create the org without a logo.
     * @nullable
     */
  logo?: Blob | null;
  name: string;
  /** @nullable */
  receipt_footer?: string | null;
  /**
     * Must every sale name a table? Default false.
     * @nullable
     */
  require_table_for_orders?: boolean | null;
  /**
     * A fraction, like the tax rate: 0.12 is 12%. Default 0.
     * @nullable
     */
  service_charge_rate?: number | null;
  /**
     * Is the service charge itself taxed? Default true.
     * @nullable
     */
  service_charge_taxable?: boolean | null;
  slug: string;
  /**
     * Are menu prices tax-inclusive? Default false (tax added on top).
     * @nullable
     */
  tax_inclusive?: boolean | null;
  /**
     * A FRACTION: 0.14 is 14%. Same unit as `PATCH /orgs/{id}`.
     * @nullable
     */
  tax_rate?: number | null;
  /** @nullable */
  timezone?: string | null;
}
