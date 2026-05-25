/* /* eslint-disable *\/ */
/**
 * // @ts-nocheck
 */
import type { ComponentPopularity } from './componentPopularity';

export interface BundlePerformanceResponse {
  component_popularity: ComponentPopularity[];
  gross_revenue: number;
  net_profit: number;
  sales_volume: number;
}
