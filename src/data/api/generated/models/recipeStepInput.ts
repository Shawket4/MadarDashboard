/* eslint-disable */
// @ts-nocheck

export interface RecipeStepInput {
  /** `preset` | `custom`. */
  kind: string;
  /**
     * What THIS item does at this step ("40ml condensed milk, mixed with the
     * shot first"). Valid on a preset step too, where it replaces the
     * library's generic note without giving up the animation.
     * @nullable
     */
  note?: string | null;
  /** @nullable */
  note_ar?: string | null;
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
