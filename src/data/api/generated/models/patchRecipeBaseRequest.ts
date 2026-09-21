/* eslint-disable */
// @ts-nocheck

export interface PatchRecipeBaseRequest {
  /**
     * Deactivating a base removes its expanded lines from every size using it
     * (the pointer stays); reactivating restores them.
     * @nullable
     */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /**
     * `""` clears the Arabic name.
     * @nullable
     */
  name_ar?: string | null;
}
