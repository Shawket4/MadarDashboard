/* eslint-disable */
// @ts-nocheck

export interface FairnessRow {
  /**
     * `m` · `f` · null (not set)
     * @nullable
     */
  gender?: string | null;
  night_shifts: number;
  people: number;
  shifts: number;
  /** Said they prefer evenings. */
  willing: number;
}
