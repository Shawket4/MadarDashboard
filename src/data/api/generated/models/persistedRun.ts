/* eslint-disable */
// @ts-nocheck
import type { AnalysisConfig } from './analysisConfig';
import type { ModeSummary } from './modeSummary';
import type { RunStatus } from './runStatus';

export interface PersistedRun {
  branch_id: string;
  /** @nullable */
  completed_at?: string | null;
  config: AnalysisConfig;
  /** @nullable */
  error_message?: string | null;
  id: string;
  mode_summary: ModeSummary;
  org_id: string;
  started_at: string;
  status: RunStatus;
  window_days: number;
}
