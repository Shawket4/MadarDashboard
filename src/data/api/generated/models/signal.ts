/* eslint-disable */
// @ts-nocheck
import type { SignalParams } from './signalParams';

/**
 * One advisory flag on a ledger row. `params` carries the evidence numbers the
 * client templates into a localized reason; `link` names the fix surface.
 */
export interface Signal {
  /**
     * below_cost | below_target | cost_spike | price_candidate |
     * removal_candidate | recipe_incomplete
     */
  kind: string;
  /** Where the fix lives: `pricing` | `studio` | `studio_recipe`. */
  link: string;
  params: SignalParams;
}
