/* eslint-disable */
// @ts-nocheck
import type { BulkLink } from './bulkLink';
import type { BulkOptional } from './bulkOptional';
import type { BulkSize } from './bulkSize';

export interface BulkItem {
  /** A [`BulkCategory::key`]. */
  category: string;
  /** @nullable */
  description?: string | null;
  /** @nullable */
  description_ar?: string | null;
  /** The item's groups, in the order the till shows them. */
  groups?: BulkLink[];
  is_active: boolean;
  name: string;
  /** @nullable */
  name_ar?: string | null;
  /** Free-form extras the item alone offers. */
  optionals?: BulkOptional[];
  /** The item's price; with no `sizes` it is the one price it sells at. */
  price: number;
  /** Each size's full price (not a difference over `price`). */
  sizes?: BulkSize[];
}
