/* eslint-disable */
// @ts-nocheck
import type { Decision } from './decision';
import type { SuggestionKind } from './suggestionKind';

export interface DecisionRecord {
  branch_id: string;
  decided_at: string;
  decided_by: string;
  decision: Decision;
  id: string;
  /** @nullable */
  notes?: string | null;
  suggestion_id: string;
  suggestion_kind: SuggestionKind;
}
