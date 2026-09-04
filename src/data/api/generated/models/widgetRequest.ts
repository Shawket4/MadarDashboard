/* eslint-disable */
// @ts-nocheck
import type { Period } from './period';
import type { QuerySpec } from './querySpec';

/**
 * One widget in a batch. Exactly one of `preset` or `spec`.
 */
export interface WidgetRequest {
  /** Caller-chosen key, echoed back so results can be matched to widgets. */
  key: string;
  period?: null | Period;
  /**
     * A curated metric id from `GET /metrics/schema`.
     * @nullable
     */
  preset?: string | null;
  spec?: null | QuerySpec;
}
