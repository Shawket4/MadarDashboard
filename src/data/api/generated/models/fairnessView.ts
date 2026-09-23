/* eslint-disable */
// @ts-nocheck
import type { FairnessRow } from './fairnessRow';

export interface FairnessView {
  accepted_4w: number;
  /** Suggestions managers decided in the last 4 weeks, and how many they accepted. */
  decided_4w: number;
  /** Learning is paused: under 40% accepted over 4 weeks. */
  learning_frozen: boolean;
  month: string;
  /** Night share by gender against stated willingness. */
  rows: FairnessRow[];
}
