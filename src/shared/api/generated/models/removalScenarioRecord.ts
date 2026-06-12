/* eslint-disable */
// @ts-nocheck
import type { DecisionRecord } from './decisionRecord';
import type { RemovalScenario } from './removalScenario';

export type RemovalScenarioRecord = RemovalScenario & ({
  branch_id: string;
  created_at: string;
  decision?: null | DecisionRecord;
  id: string;
  run_id: string;
});
