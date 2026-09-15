/* eslint-disable */
// @ts-nocheck

export interface ExplainStep {
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  detail?: string | null;
  /**
     * owner | inactive | assignment | core | override_allow | override_deny |
     * protected | not_held | limit | ask_manager
     */
  kind: string;
  /** @nullable */
  role_name?: string | null;
}
