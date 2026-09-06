/* eslint-disable */
// @ts-nocheck

export interface RecipeStepInput {
  /** `preset` | `custom`. */
  kind: string;
  /**
     * Required for `preset`.
     * @nullable
     */
  preset_slug?: string | null;
  /**
     * The typed name, for `custom`. Either language will do.
     * @nullable
     */
  title?: string | null;
  /** @nullable */
  title_ar?: string | null;
}
