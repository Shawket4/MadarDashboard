/* eslint-disable */
// @ts-nocheck
import type { RecipeBaseLineInput } from './recipeBaseLineInput';

export interface CreateRecipeBaseRequest {
  /** @nullable */
  is_active?: boolean | null;
  /**
     * Optional initial lines (same as `PUT /recipe-bases/{id}/lines`).
     * @nullable
     */
  lines?: RecipeBaseLineInput[] | null;
  name: string;
  /** @nullable */
  name_ar?: string | null;
}
