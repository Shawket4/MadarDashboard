/* eslint-disable */
// @ts-nocheck

export type ResetDayParams = {
employee_id: string;
on_date: string;
/**
 * The board it is reset from (BUG-4): only the blocks worked at that
 * branch go back to the pattern; the other branches' stay (one of the
 * person's branches, else 400 `EMPLOYEE_NOT_AT_BRANCH`). Omitted (an
 * old client) = the branches the caller may edit the roster at: an
 * owner resets the whole date, as before.
 */
branch_id?: string;
};
