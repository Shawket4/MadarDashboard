/* eslint-disable */
// @ts-nocheck
import type { ComboWarningVars } from './comboWarningVars';

/**
 * A margin/saving warning (C11). Never a refusal: a combo saves with any.
 * Codes: `MARGIN_BELOW_MIN {margin, min}`, `NO_SAVING`,
 * `COST_UNKNOWN {menu_item_id}`, `SLOT_EMPTY_NOW {slot_id}`,
 * `CHOICE_INACTIVE {menu_item_id}`.
 */
export interface ComboWarning {
  code: string;
  vars?: ComboWarningVars;
}
