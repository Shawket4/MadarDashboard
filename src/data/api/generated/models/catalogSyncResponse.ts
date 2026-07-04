/* eslint-disable */
// @ts-nocheck
import type { SyncIngredient } from './syncIngredient';
import type { SyncItem } from './syncItem';

/**
 * The full catalog snapshot for a POS device.
 */
export interface CatalogSyncResponse {
  catalog_revision: number;
  /**
     * `false` when `since` equals the current revision (client is up to date;
     * `items`/`ingredients` are then empty). `true` ⇒ the full payload follows.
     */
  changed: boolean;
  ingredients?: SyncIngredient[];
  items?: SyncItem[];
}
