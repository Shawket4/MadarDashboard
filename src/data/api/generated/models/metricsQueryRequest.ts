/* eslint-disable */
// @ts-nocheck
import type { Period } from './period';
import type { WidgetRequest } from './widgetRequest';

export interface MetricsQueryRequest {
  /**
     * Answer language for translated labels ("en" or "ar").
     * @nullable
     */
  locale?: string | null;
  period?: null | Period;
  widgets: WidgetRequest[];
}
