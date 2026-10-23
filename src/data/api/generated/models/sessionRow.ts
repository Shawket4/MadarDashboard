/* eslint-disable */
// @ts-nocheck

export interface SessionRow {
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  branch_name?: string | null;
  /**
     * `X-Madar-Client`: `<app>/<version> (<platform>)`.
     * @nullable
     */
  client?: string | null;
  created_at: string;
  /** @nullable */
  device_id?: string | null;
  expires_at: string;
  id: string;
  /** @nullable */
  ip?: string | null;
  kind: string;
  last_seen_at: string;
  /** @nullable */
  org_id?: string | null;
  /** @nullable */
  org_name?: string | null;
  /** @nullable */
  revoke_reason?: string | null;
  /** @nullable */
  revoked_at?: string | null;
  /** @nullable */
  revoked_by_name?: string | null;
  role: string;
  /** `active` | `revoked` | `expired`. */
  state: string;
  /** @nullable */
  user_agent?: string | null;
  /** @nullable */
  user_email?: string | null;
  user_id: string;
  user_name: string;
}
