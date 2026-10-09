/* eslint-disable */
// @ts-nocheck
import type { GroupAttachInput } from './groupAttachInput';

export interface PutModifierGroupsRequest {
  /**
     * The item's full set of reusable groups, in order. `[]` detaches every
     * group (the item then offers none). Omitted or `null` changes nothing,
     * so a partial update or an older client never detaches by accident.
     * The item's own priced options are not in this set: they belong to
     * `PUT /menu-items/{id}/options`.
     * @nullable
     */
  groups?: GroupAttachInput[] | null;
}
