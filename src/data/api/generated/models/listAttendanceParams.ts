/* eslint-disable */
// @ts-nocheck

export type ListAttendanceParams = {
/**
 * Required unless `cover_status` or `overtime_status` is `pending`.
 */
from?: string;
/**
 * Required unless `cover_status` or `overtime_status` is `pending`.
 */
to?: string;
branch_id?: string;
employee_id?: string;
status?: string;
/**
 * `pending` · `confirmed` · `rejected`: covers in that state.
 */
cover_status?: string;
/**
 * `pending` · `approved` · `rejected`: overtime in that state.
 */
overtime_status?: string;
};
