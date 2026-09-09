/* eslint-disable */
// @ts-nocheck

/**
 * The tax policy the caller should price under, resolved for their branch
 * where they have one and their organisation otherwise.
 *
 * Sent at login and on every `/auth/me`, which is what makes a rate change
 * reach a till that has been running for weeks. The flat `tax_rate` beside it
 * is kept for builds that predate this object; both describe the same rate.
 */
export interface TaxPolicyPublic {
  /** Fraction of the bill added as a service charge; `0` disables it. */
  service_charge_rate: number;
  /** Whether the service charge is itself taxed. */
  service_charge_taxable: boolean;
  /** `true` = menu prices already contain the tax. */
  tax_inclusive: boolean;
  /** Fraction, NOT a percentage: `0.14` is 14%. */
  tax_rate: number;
}
