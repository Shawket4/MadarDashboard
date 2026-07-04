/* eslint-disable */
// @ts-nocheck
import type { DecisionOutBaseline } from './decisionOutBaseline';
import type { DecisionOutDetail } from './decisionOutDetail';
import type { DecisionOutImpact } from './decisionOutImpact';

export interface DecisionOut {
  action: string;
  baseline: DecisionOutBaseline;
  /** @nullable */
  branch_id?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  detail: DecisionOutDetail;
  id: string;
  /** Measured after-window aggregate; `null` until ≥1 day of after-data. */
  impact: DecisionOutImpact;
  /** True once the full baseline window has elapsed since the decision. */
  impact_complete: boolean;
  item_name: string;
  menu_item_id: string;
  signal_kind: string;
  size_label: string;
}
