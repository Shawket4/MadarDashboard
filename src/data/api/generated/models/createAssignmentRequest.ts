/* eslint-disable */
// @ts-nocheck

export interface CreateAssignmentRequest {
  /**
     * The branch whose board sets the pattern: a business-wide block is
     * worked there every week (one of the person's branches, else 400
     * `EMPLOYEE_NOT_AT_BRANCH`). Omitted = the person's first branch.
     * @nullable
     */
  branch_id?: string | null;
  /**
     * 0 = Sunday … 6 = Saturday. Omit for "every day".
     * @nullable
     */
  day_of_week?: number | null;
  /** @nullable */
  effective_from?: string | null;
  /** @nullable */
  effective_to?: string | null;
  employee_id: string;
  work_shift_id: string;
}
