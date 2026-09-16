/* eslint-disable */
// @ts-nocheck
import type { RecipeBaseLineOut } from './recipeBaseLineOut';

export interface RecipeBaseOut {
  created_at: string;
  id: string;
  is_active: boolean;
  /** Distinct menu items those sizes belong to. */
  item_count: number;
  lines: RecipeBaseLineOut[];
  name: string;
  /** @nullable */
  name_ar?: string | null;
  org_id: string;
  /** Item sizes currently pointing at this base. */
  size_count: number;
  updated_at: string;
}
