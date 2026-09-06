/* eslint-disable */
// @ts-nocheck
import type { RecipeStepInput } from './recipeStepInput';

export interface PutRecipeStepsRequest {
  /** The whole list, in order. Replaces what was there. */
  steps: RecipeStepInput[];
}
