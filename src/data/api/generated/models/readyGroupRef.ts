/* eslint-disable */
// @ts-nocheck
import type { VariantSet } from './variantSet';

export interface ReadyGroupRef {
  group_id: string;
  has_alpha: boolean;
  /** @nullable */
  height?: number | null;
  /** @nullable */
  label?: string | null;
  variants: VariantSet;
  /** @nullable */
  width?: number | null;
}
