/* eslint-disable */
// @ts-nocheck
import type { AssetJobResult } from './assetJobResult';

export interface AssetJobView {
  /** @nullable */
  error?: string | null;
  id: string;
  result?: null | AssetJobResult;
  /** queued | running | done | failed */
  status: string;
}
