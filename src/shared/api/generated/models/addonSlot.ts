/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface AddonSlot {
  addon_type: string;
  created_at: string;
  display_order: number;
  id: string;
  is_required: boolean;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  max_selections?: number | null;
  menu_item_id: string;
  min_selections: number;
}
