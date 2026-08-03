/* eslint-disable */
// @ts-nocheck

export interface CredentialSummary {
  branch_id: string;
  branch_name: string;
  created_at: string;
  id: string;
  /**
     * Last successful authentication, or null if the partner has never pulled.
     * @nullable
     */
  last_used_at?: string | null;
  name: string;
  /** @nullable */
  revoked_at?: string | null;
  username: string;
}
