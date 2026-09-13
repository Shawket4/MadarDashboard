/* eslint-disable */
// @ts-nocheck
import type { PresenceRow } from './presenceRow';

/**
 * The whole team's state right now, plus the day's labour against plan.
 */
export interface TeamPresence {
  absent: number;
  /** The branch's business date, in ITS timezone — not the manager's device. */
  business_date: string;
  late: number;
  on_leave: number;
  /** Minutes rostered for today across the team. */
  planned_minutes: number;
  present: number;
  rows: PresenceRow[];
  /**
     * The IANA timezone this payload's instants are shown in (see `crate::tz`).
     * Additive; older clients ignore it.
     * @nullable
     */
  timezone?: string | null;
  /** Minutes actually worked so far today across the team. */
  worked_minutes: number;
}
