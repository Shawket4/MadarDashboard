/* eslint-disable */
// @ts-nocheck

/**
 * A PATCH: an absent field is left as it is. For the contact fields, `null`
 * or a blank value clears them.
 */
export interface UpdateSupplierRequest {
  /** @nullable */
  contact_name?: string | null;
  /** @nullable */
  email?: string | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  phone?: string | null;
}
