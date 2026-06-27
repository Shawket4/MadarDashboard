/* eslint-disable */
// @ts-nocheck

export type GetCurrentShiftParams = {
/**
 * The device's till (drawer). Narrows the open-shift lookup for managers and
 * scopes the suggested opening cash to that drawer's carryover. Optional —
 * omit to fall back to the branch's default till for the suggestion.
 */
till_id?: string;
};
