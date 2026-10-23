/* eslint-disable */
// @ts-nocheck
import type { FieldSource } from './fieldSource';

/**
 * Google's two slots on the face of the card.
 */
export interface GoogleFields {
  /** `loyaltyPoints`, the largest text on the card. */
  points: FieldSource;
  secondary?: null | FieldSource;
}
