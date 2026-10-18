/* eslint-disable */
// @ts-nocheck

/**
 * The remembered price expressed per one purchase unit.
 */
export interface LastUnitPrice {
  unit: string;
  /** Piastres per one `unit`, exact (6 dp). */
  unit_price: number;
}
