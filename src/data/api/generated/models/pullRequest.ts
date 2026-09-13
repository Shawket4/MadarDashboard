/* eslint-disable */
// @ts-nocheck

export interface PullRequest {
  branch_id: string;
  /** @nullable */
  device_id?: string | null;
  /**
     * Page size for incremental pulls, 1..5000 (default 2000).
     * @nullable
     */
  limit?: number | null;
  /**
     * Full-fetch ONLY these types (checksum self-heal). Invalid with `since`.
     * @nullable
     */
  types?: string[] | null;
}
