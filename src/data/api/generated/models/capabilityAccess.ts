/* eslint-disable */
// @ts-nocheck
import type { LimitsView } from './limitsView';
import type { OverrideView } from './overrideView';

export interface CapabilityAccess {
  capability: string;
  /** Can the caller change this row for this person? */
  editable: boolean;
  /** Held here after everything. */
  effective: boolean;
  /** Role names granting it (for "Inherits from …"). */
  from_roles: string[];
  limits?: null | LimitsView;
  overrides: OverrideView[];
  /** Where the answer comes from: owner | core | allow | deny | role | none. */
  source: string;
}
