/* eslint-disable */
// @ts-nocheck
import type { Audience } from './audience';
import type { MemberSort } from './memberSort';

export interface MembersQueryRequest {
  /** A segment (madar-card's audience rules); empty = every member. */
  audience?: Audience;
  /** Newest / most / latest first when true (the default). */
  desc?: boolean;
  /** @nullable */
  limit?: number | null;
  /** @nullable */
  offset?: number | null;
  /**
     * Name or phone fragment.
     * @nullable
     */
  q?: string | null;
  sort?: MemberSort;
}
