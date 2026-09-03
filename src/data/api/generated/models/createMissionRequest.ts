/* eslint-disable */
// @ts-nocheck

export interface CreateMissionRequest {
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  description?: string | null;
  ends_at: string;
  /** @nullable */
  location?: string | null;
  starts_at: string;
  title: string;
  /** @nullable */
  user_id?: string | null;
}
