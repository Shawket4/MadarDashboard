/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { CreateAddonSlotRequestLabelTranslations } from './createAddonSlotRequestLabelTranslations';

export interface CreateAddonSlotRequest {
  /** @nullable */
  addon_type?: string | null;
  /** @nullable */
  display_order?: number | null;
  /** @nullable */
  is_required?: boolean | null;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  label_translations?: CreateAddonSlotRequestLabelTranslations;
  /** @nullable */
  max_selections?: number | null;
  /** @nullable */
  min_selections?: number | null;
}
