/* eslint-disable */
// @ts-nocheck

export interface GroupAttachInput {
  group_id: string;
  /**
     * `null` = offer all of the group's options; else the allowlisted subset.
     * @nullable
     */
  included_option_ids?: string[] | null;
  /** @nullable */
  is_required_override?: boolean | null;
  /** @nullable */
  max_override?: number | null;
  /** @nullable */
  min_override?: number | null;
  sort?: number;
}
