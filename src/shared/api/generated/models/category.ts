/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface Category {
  created_at: string;
  /** @nullable */
  deleted_at?: string | null;
  display_order: number;
  id: string;
  /** @nullable */
  image_url?: string | null;
  is_active: boolean;
  name: string;
  org_id: string;
  updated_at: string;
}
