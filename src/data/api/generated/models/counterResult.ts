/* eslint-disable */
// @ts-nocheck
import type { MemberView } from './memberView';

export interface CounterResult {
  /** True when this key had already been used: nothing new was written. */
  already: boolean;
  /** The member after the change, with the card's figures. */
  member: MemberView;
  /**
     * Stamps this call moved: positive for a stamp, negative for a completed
     * card. On a retry, what the first call moved.
     */
  stamps: number;
}
