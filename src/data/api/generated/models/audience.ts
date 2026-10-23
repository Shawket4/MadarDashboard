/* eslint-disable */
// @ts-nocheck
import type { Rule } from './rule';

/**
 * Every member (no rules), or those matching all of `rules`.
 */
export interface Audience {
  rules?: Rule[];
}
