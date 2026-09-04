/* eslint-disable */
// @ts-nocheck
import type { MetricsQueryResponseResults } from './metricsQueryResponseResults';
import type { ScopeInfo } from './scopeInfo';

export interface MetricsQueryResponse {
  results: MetricsQueryResponseResults;
  /** Which branches every result covers. */
  scope: ScopeInfo;
  /** The timezone all time buckets were computed in. */
  timezone: string;
}
