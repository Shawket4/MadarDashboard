/* eslint-disable */
// @ts-nocheck

/**
 * One curated step the dashboard offers.
 */
export interface RecipeStepPreset {
  animation_sha256: string;
  /** Path to the animation, relative to the API base. */
  animation_url: string;
  bytes: number;
  name: string;
  name_ar: string;
  /** @nullable */
  note?: string | null;
  /** @nullable */
  note_ar?: string | null;
  slug: string;
  sort_order: number;
}
