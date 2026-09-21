/* eslint-disable */
// @ts-nocheck

export interface CreateLinkedCopyRequest {
  /**
     * Menu category of the copy; `null` keeps the source's category.
     * @nullable
     */
  category_id?: string | null;
  name: string;
  /** Price in piastres for every size of the copy (0 for a staff drink). */
  price: number;
}
