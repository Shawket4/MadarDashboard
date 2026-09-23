/* eslint-disable */
// @ts-nocheck

export type ListEmployeesParams = {
department_id?: string;
/**
 * `active` | `suspended` | `terminated`. Omitted = every status.
 */
employment_status?: string;
/**
 * Case-insensitive substring over name, employee code, and job title.
 */
search?: string;
/**
 * Only the people of this branch.
 */
branch_id?: string;
/**
 * `linked` · `app` · `manual`.
 */
kind?: string;
};
