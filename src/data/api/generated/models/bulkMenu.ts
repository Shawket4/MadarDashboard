/* eslint-disable */
// @ts-nocheck
import type { BulkCategory } from './bulkCategory';
import type { BulkGroup } from './bulkGroup';
import type { BulkItem } from './bulkItem';

export interface BulkMenu {
  categories?: BulkCategory[];
  groups?: BulkGroup[];
  items?: BulkItem[];
  /** @minimum 0 */
  version: number;
}
