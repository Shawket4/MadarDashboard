/* eslint-disable */
// @ts-nocheck

/**
 * One preparation step, both languages.
 */
export interface RecipeCardStep {
  name: string;
  name_ar: string;
  /** @nullable */
  note?: string | null;
  /** @nullable */
  note_ar?: string | null;
  position: number;
}
