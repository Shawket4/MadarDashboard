/* eslint-disable */
// @ts-nocheck
import type { CreateDiscountRequestNameTranslations } from './createDiscountRequestNameTranslations';

export interface CreateDiscountRequest {
  dtype: string;
  /** @nullable */
  is_active?: boolean | null;
  name: string;
  /** @nullable */
  name_translations?: CreateDiscountRequestNameTranslations;
  org_id: string;
  value: number;
}
