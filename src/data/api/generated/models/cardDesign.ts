/* eslint-disable */
// @ts-nocheck
import type { AppleFields } from './appleFields';
import type { Colours } from './colours';
import type { Element } from './element';
import type { GoogleFields } from './googleFields';
import type { Ground } from './ground';
import type { StampStyle } from './stampStyle';

/**
 * The whole design.
 */
export interface CardDesign {
  apple: AppleFields;
  colours: Colours;
  /** What the strip (Apple) and the hero (Google) show, on the grid. */
  elements?: Element[];
  google: GoogleFields;
  ground: Ground;
  stamp: StampStyle;
  /** The template it started from (informational: `classic`, `stamps`, …). */
  template?: string;
  /** @minimum 0 */
  version: number;
}
