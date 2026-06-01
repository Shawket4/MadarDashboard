/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { UpdateDiscountRequestNameTranslations } from './updateDiscountRequestNameTranslations';

export interface UpdateDiscountRequest {
  /** @nullable */
  dtype?: string | null;
  /** @nullable */
  is_active?: boolean | null;
  /** @nullable */
  name?: string | null;
  /** @nullable */
  name_translations?: UpdateDiscountRequestNameTranslations;
  /** @nullable */
  value?: number | null;
}
