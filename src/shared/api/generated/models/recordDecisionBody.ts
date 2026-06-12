/* eslint-disable */
// @ts-nocheck
import type { SuggestionKind } from './suggestionKind';

export interface RecordDecisionBody {
  branch_id: string;
  /** accepted | rejected | ignored — kept as a string so invalid values
   * yield a 400 instead of a deserialization error. */
  decision: string;
  /** @nullable */
  notes?: string | null;
  suggestion_id: string;
  suggestion_kind: SuggestionKind;
}
