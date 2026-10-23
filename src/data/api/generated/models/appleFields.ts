/* eslint-disable */
// @ts-nocheck
import type { FieldSource } from './fieldSource';

/**
 * Apple's store-card field groups. The back of the card is not designed: it
 * carries how it works, branches, terms and links, as today.
 */
export interface AppleFields {
  auxiliary?: FieldSource[];
  /** Top right beside the logo, and the only thing a stacked wallet shows. */
  header?: FieldSource[];
  primary?: null | FieldSource;
  secondary?: FieldSource[];
}
