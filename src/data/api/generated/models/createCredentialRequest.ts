/* eslint-disable */
// @ts-nocheck

export interface CreateCredentialRequest {
  /** The single branch this credential may read. */
  branch_id: string;
  /** Operator-facing label, e.g. "Rue — One Ninety". */
  name: string;
  /** Basic-auth username. Unique across all orgs, case-insensitively. */
  username: string;
}
