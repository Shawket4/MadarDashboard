/* eslint-disable */
// @ts-nocheck

export type GetScheduledDayParams = {
user_id: string;
date: string;
/**
 * Which branch's timezone the day is measured in. Defaults to the
 * employee's only branch assignment when they have exactly one.
 */
branch_id?: string;
};
