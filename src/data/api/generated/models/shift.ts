/* eslint-disable */
// @ts-nocheck
import type { Till } from './till';

/**
 * Legacy `Shift` = `Till` + `till_id`/`till_name`: the branch's legacy drawer
 * entity (the one `GET /tills` synthesizes) and its name, exactly as the
 * pre-rename backend reported them. Build it with [`legacy_shift`].
 */
export type Shift = Till & ({
  /** @nullable */
  till_id?: string | null;
  /** @nullable */
  till_name?: string | null;
});
