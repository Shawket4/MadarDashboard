/* eslint-disable */
// @ts-nocheck

export type ListExpenseAdvancesParams = {
employee_id?: string;
/**
 * Only the expenses logged at this branch (the expense's own branch,
 * AV-9). A branch the caller can't read is refused (403).
 */
branch_id?: string;
};
