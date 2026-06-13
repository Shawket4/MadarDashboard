/* eslint-disable */
// @ts-nocheck
import type { UpdateAddonSlotRequestLabelTranslations } from './updateAddonSlotRequestLabelTranslations';

export interface UpdateAddonSlotRequest {
  /** @nullable */
  is_required?: boolean | null;
  /** @nullable */
  label?: string | null;
  /** @nullable */
  label_translations?: UpdateAddonSlotRequestLabelTranslations;
  /** @nullable */
  max_selections?: number | null;
  /** @nullable */
  min_selections?: number | null;
}
