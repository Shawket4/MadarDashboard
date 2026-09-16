/* eslint-disable */
// @ts-nocheck
import type { GroupOptionRecipeLine } from './groupOptionRecipeLine';

/**
 * A modifier option as returned by the reusable-group endpoints (org-scoped,
 * no per-item `included`/cost context — that belongs to the studio aggregate).
 */
export interface GroupOptionOut {
  id: string;
  is_active: boolean;
  is_default: boolean;
  name: string;
  name_translations: unknown;
  price: number;
  /** The option's recipe lines (base unit), ordered by ingredient name. */
  recipe?: GroupOptionRecipeLine[];
  /** @nullable */
  replaces_ingredient_id?: string | null;
  sort: number;
}
