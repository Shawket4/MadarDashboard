/* eslint-disable */
// @ts-nocheck

export interface FairnessRow {
  accepted?: number;
  /**
     * `m` · `f` · null (not set)
     * @nullable
     */
  gender?: string | null;
  night_shifts: number;
  people: number;
  shifts: number;
  /**
     * Suggestions for people of this gender decided in the month, and
     * accepted.
     */
  suggested?: number;
  /** Said they prefer evenings. */
  willing: number;
}
