/* eslint-disable */
// @ts-nocheck

export interface CreateAssignmentRequest {
  /**
     * 0 = Sunday … 6 = Saturday. Omit for "every day".
     * @nullable
     */
  day_of_week?: number | null;
  /** @nullable */
  effective_from?: string | null;
  /** @nullable */
  effective_to?: string | null;
  user_id: string;
  work_shift_id: string;
}
