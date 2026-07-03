/* eslint-disable */
// @ts-nocheck

/**
 * One recipe line of a modifier option: which ingredient the option deducts
 * (or swaps in, when `quantity = 0`). Base-unit, yield-normalized values.
 */
export interface SyncRecipeLine {
  ingredient_id: string;
  /** Base-unit quantity, serialized as a string for numeric fidelity. */
  quantity: string;
  unit: string;
}
