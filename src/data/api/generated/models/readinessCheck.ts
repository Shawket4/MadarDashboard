/* eslint-disable */
// @ts-nocheck
import type { CheckLevel } from './checkLevel';
import type { ReadinessProblem } from './readinessProblem';

export interface ReadinessCheck {
  /**
     * How many things the check counted: problems when it names them, else the
     * things found (branches, sellable items, people).
     */
  count: number;
  /**
     * Stable key the dashboards switch on, never localized: `branch`, `menu`,
     * `payment`, `sign_in`, `tablet`, `items_no_category`, `items_zero_price`,
     * `required_group_empty`, `menu_lint`, `recipes`, `ingredient_costs`, `team`, `receipt`.
     */
  key: string;
  level: CheckLevel;
  /** Problems past the first 20. */
  more: number;
  ok: boolean;
  /** Up to 20 named problems. */
  problems: ReadinessProblem[];
  /**
     * What `count` is out of, when that reads better as a share (recipes: of active items).
     * @nullable
     */
  total?: number | null;
}
