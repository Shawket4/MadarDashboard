/* eslint-disable */
// @ts-nocheck

/**
 * One step, resolved for display: whatever its kind, it has a name, and a
 * preset step also carries its note and the animation to play.
 */
export interface RecipeStep {
  /** @nullable */
  animation_sha256?: string | null;
  /**
     * Present only for a preset whose animation still ships. `None` on a
     * custom step, and on a retired preset — clients show the name alone.
     * @nullable
     */
  animation_url?: string | null;
  /** `preset` | `custom`. */
  kind: string;
  /** The preset's name, or the typed name of a custom step. */
  name: string;
  name_ar: string;
  /** @nullable */
  note?: string | null;
  /** @nullable */
  note_ar?: string | null;
  position: number;
  /**
     * The preset this step uses, if any.
     * @nullable
     */
  preset_slug?: string | null;
}
