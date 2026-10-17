/* eslint-disable */
// @ts-nocheck
import type { AssetBundleRef } from './assetBundleRef';
import type { LedgerWindow } from './ledgerWindow';
import type { PullChange } from './pullChange';
import type { PullResponseChecksums } from './pullResponseChecksums';
import type { PullResponseData } from './pullResponseData';
import type { SnapshotCursor } from './snapshotCursor';

/**
 * Any `/sync/pull` response (incremental, resync or full).
 */
export interface PullResponse {
  asset_bundle?: null | AssetBundleRef;
  changes?: PullChange[];
  checksums?: PullResponseChecksums;
  data?: PullResponseData;
  full: boolean;
  has_more: boolean;
  /**
     * v2: how long (hours) a ledger row stays on the incremental feed; a
     * cursor older than that is answered `resync_required`.
     * @nullable
     */
  ledger_retention_hours?: number | null;
  ledger_window?: null | LedgerWindow;
  /** @nullable */
  next?: number | null;
  /**
     * The negotiated sync protocol; only when the request named one.
     * @minimum 0
     * @nullable
     */
  protocol?: number | null;
  resync_required?: boolean;
  server_time: string;
  /** @nullable */
  since?: number | null;
  snapshot_cursor?: null | SnapshotCursor;
  types?: string[];
}
