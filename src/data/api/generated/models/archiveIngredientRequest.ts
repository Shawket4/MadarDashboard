/* eslint-disable */
// @ts-nocheck

export interface ArchiveIngredientRequest {
  /**
     * Required (`true`) when the ingredient is still used or holds stock
     * (`GET …/usage` says so); otherwise the archive answers 409
     * `ARCHIVE_NEEDS_CONFIRMATION`.
     */
  confirm?: boolean;
}
