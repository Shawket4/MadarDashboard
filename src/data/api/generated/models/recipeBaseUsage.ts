/* eslint-disable */
// @ts-nocheck
import type { RecipeBaseUsageSize } from './recipeBaseUsageSize';

export interface RecipeBaseUsage {
  base_id: string;
  item_count: number;
  size_count: number;
  sizes: RecipeBaseUsageSize[];
}
