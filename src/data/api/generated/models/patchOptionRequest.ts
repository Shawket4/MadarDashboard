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
  /**
     * Absent = keep; `null` = clear the swap link; an ingredient id = set.
     * @nullable
     */
  replaces_ingredient_id?: string | null;
  /**
     * Display order inside the group.
     * @nullable
     */
  sort?: number | null;
}
