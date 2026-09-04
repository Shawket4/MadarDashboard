/* eslint-disable */
// @ts-nocheck
import type { Compare } from './compare';
import type { Period } from './period';
import type { QuerySpecFilters } from './querySpecFilters';
import type { Sort } from './sort';
import type { Transform } from './transform';
import type { Viz } from './viz';

/**
 * A fully-specified analytics question.
 */
export interface QuerySpec {
  /**
     * Narrow to ONE branch by name. Fuzzy-matched *within* the caller's
     * accessible branches, so it can only ever narrow, never widen. Dashboards
     * use the request-level scope instead and leave this unset.
     * @nullable
     */
  branch?: string | null;
  /** Period-over-period comparison. */
  compare?: Compare;
  /** Dataset id — fixes the grain. See `GET /metrics/schema`. */
  dataset: string;
  /** GROUP BY axes, outermost first. Empty = a single total row. */
  dimensions?: string[];
  /** Filter id → chosen value. Each value selects a pre-written predicate. */
  filters?: QuerySpecFilters;
  /**
     * Only keep groups whose sort measure reaches this value.
     * @nullable
     */
  having_min?: number | null;
  /**
     * Row cap, clamped to [`MAX_LIMIT`].
     * @minimum 0
     * @nullable
     */
  limit?: number | null;
  /** Aggregates to compute. Empty = the dataset's headline measures. */
  measures?: string[];
  period?: Period;
  sort?: null | Sort;
  transform?: Transform;
  viz?: null | Viz;
}
