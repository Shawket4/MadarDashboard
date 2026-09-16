/* eslint-disable */
// @ts-nocheck
import type { AssignmentView } from './assignmentView';
import type { CapabilityAccess } from './capabilityAccess';

export interface UserAccess {
  assignments: AssignmentView[];
  /** @nullable */
  branch_id?: string | null;
  /** Can the caller edit this person's access at all? */
  can_edit: boolean;
  capabilities: CapabilityAccess[];
  is_owner: boolean;
  /**
     * Why not, when not (self | owner | not_dominant | not_above | missing_authority).
     * @nullable
     */
  locked_reason?: string | null;
  name: string;
  user_id: string;
}
