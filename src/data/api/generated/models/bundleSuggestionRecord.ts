/* eslint-disable */
// @ts-nocheck
import type { BundleSuggestion } from './bundleSuggestion';
import type { DecisionRecord } from './decisionRecord';

export type BundleSuggestionRecord = BundleSuggestion & ({
  branch_id: string;
  created_at: string;
  decision?: null | DecisionRecord;
  id: string;
  /** @nullable */
  promoted_bundle_id?: string | null;
  run_id: string;
});
