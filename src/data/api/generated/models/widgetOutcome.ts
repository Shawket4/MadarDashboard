/* eslint-disable */
// @ts-nocheck
import type { MetricResult } from './metricResult';

/**
 * A widget either produced a result or an explanation. Never both, never
 * neither — and a failure here is a 200 with an `error`, not a failed batch.
 */
export type WidgetOutcome = MetricResult & {
  status: 'ok';
} | {
  error: string;
  status: 'error';
};
