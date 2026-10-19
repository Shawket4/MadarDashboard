/* eslint-disable */
// @ts-nocheck
import type { BulkFamily } from './bulkFamily';
import type { BulkOption } from './bulkOption';

export interface BulkGroup {
  family: BulkFamily;
  key: string;
  /**
     * `None`: as many as there are options.
     * @minimum 0
     * @nullable
     */
  max?: number | null;
  /**
     * The group's own limits; an item's link may differ ([`BulkLink`]).
     * @minimum 0
     */
  min: number;
  name: string;
  /** @nullable */
  name_ar?: string | null;
  options: BulkOption[];
}
