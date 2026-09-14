/* eslint-disable */
// @ts-nocheck
import type { PullChangeData } from './pullChangeData';

export interface PullChange {
  data: PullChangeData;
  id: string;
  /** `upsert` | `delete`. */
  op: string;
  seq: number;
  type: string;
}
