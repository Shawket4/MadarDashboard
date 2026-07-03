/* eslint-disable */
// @ts-nocheck
import type { PatchOptionRequestNameTranslations } from './patchOptionRequestNameTranslations';

export interface PatchOptionRequest {
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  is_default?: boolean | null;
  /** @nullable */
  name?: string | null;
  name_translations?: PatchOptionRequestNameTranslations;
  /** @nullable */
  price?: number | null;
  /** @nullable */
  replaces_ingredient_id?: string | null;
}
