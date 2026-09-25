/* eslint-disable */
// @ts-nocheck

/**
 * A size of a public combo choice.
 */
export interface PublicComboSize {
  /**
     * What picking it adds inside the combo (the owner's surcharge, else the
     * difference over the included size, floored at 0; 0 for the included size).
     */
  extra: number;
  label: string;
  /** Its normal channel price. */
  price: number;
}
