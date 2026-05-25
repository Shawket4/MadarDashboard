/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface Org {
  currency_code: string;
  id: string;
  is_active: boolean;
  /** @nullable */
  logo_url?: string | null;
  name: string;
  /** @nullable */
  receipt_footer?: string | null;
  slug: string;
  /** Tax rate as a decimal (e.g. `0.14` for 14% VAT).
   * Stored as `BigDecimal` internally; transmitted as a JSON number. */
  tax_rate: number;
}
