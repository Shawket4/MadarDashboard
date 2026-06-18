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
  slug: string;
  /** @nullable */
  tax_rate?: number | null;
  /** @nullable */
  timezone?: string | null;
}
