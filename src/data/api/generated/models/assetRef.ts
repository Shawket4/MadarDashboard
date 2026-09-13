/* eslint-disable */
// @ts-nocheck

export interface AssetRef {
  bytes: number;
  content_type: string;
  ext: string;
  group_id: string;
  has_alpha: boolean;
  hash: string;
  /** @nullable */
  height?: number | null;
  id: string;
  kind: string;
  /** @nullable */
  org_id?: string | null;
  /** Signed, org-scoped (§11.4), 24 h bucketed. */
  url: string;
  variant: string;
  /** @nullable */
  width?: number | null;
}
