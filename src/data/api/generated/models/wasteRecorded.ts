/* eslint-disable */
// @ts-nocheck
import type { WasteLine } from './wasteLine';

export interface WasteRecorded {
  branch_id: string;
  /** `false` when this id had already been recorded (nothing new was posted). */
  created: boolean;
  id: string;
  lines: WasteLine[];
  /** @nullable */
  note?: string | null;
  occurred_at: string;
  quantity: number;
  reason: string;
  /** @nullable */
  recorded_by?: string | null;
  /** @nullable */
  size_label?: string | null;
  source: string;
  subject_kind: string;
  subject_name: string;
  unit: string;
  /**
     * Piastres at the branch's unit costs; `null` when no line had a cost.
     * @nullable
     */
  value_minor?: number | null;
  value_partial: boolean;
}
