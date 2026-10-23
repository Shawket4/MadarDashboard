/* eslint-disable */
// @ts-nocheck
import type { TextAlign } from './textAlign';
import type { TextSize } from './textSize';

/**
 * The kinds of thing a strip can hold. Each is drawn by [`crate::render`].
 */
export type ElementKind = {
  /** @minimum 0 */
  track: number;
  type: 'stamps';
} | {
  /** @minimum 0 */
  track: number;
  type: 'bar';
} | {
  /** @minimum 0 */
  track: number;
  type: 'count';
} | {
  align: TextAlign;
  ar?: string;
  en?: string;
  size: TextSize;
  type: 'text';
} | {
  type: 'logo';
};
