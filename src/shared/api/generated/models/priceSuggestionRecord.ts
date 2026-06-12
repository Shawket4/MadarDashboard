/* eslint-disable */
// @ts-nocheck
import type { DecisionRecord } from './decisionRecord';
import type { PriceSuggestion } from './priceSuggestion';

export type PriceSuggestionRecord = PriceSuggestion & ({
  branch_id: string;
  created_at: string;
  decision?: null | DecisionRecord;
  id: string;
  run_id: string;
});
