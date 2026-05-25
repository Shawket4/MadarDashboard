/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */

export interface CreateAddonSlotRequest {
  addon_type: string;
  /** @nullable */
  display_order?: number | null;
  /** @nullable */
  is_required?: boolean | null;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  max_selections?: number | null;
  /** @nullable */
  min_selections?: number | null;
}
