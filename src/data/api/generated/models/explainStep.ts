/* eslint-disable */
// @ts-nocheck

export interface ExplainStep {
  /**
     * For an assignment step: does the assignment cover the branch asked about?
     * @nullable
     */
  applies_here?: boolean | null;
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  detail?: string | null;
  /**
     * For an assignment step: does the role grant the capability?
     * @nullable
     */
  grants?: boolean | null;
  /**
     * owner | inactive | assignment | core | override_allow | override_deny |
     * protected | not_held | limit | ask_manager
     */
  kind: string;
  /** @nullable */
  role_name?: string | null;
  /**
     * The role's Arabic name, beside `role_name`.
     * @nullable
     */
  role_name_ar?: string | null;
}
