/* eslint-disable */
// @ts-nocheck

export type ListFlagsParams = {
/**
 * Include flags already reviewed. Default false: the queue is what is left
 * to look at.
 */
include_reviewed?: boolean;
/**
 * Optional one-time manager approval, the ordinary `ReplayApproval` shape
 * JSON-encoded (a GET has no body). A till signed in as a TELLER uses it
 * to pull its own branch's flags with a manager's PIN; leaving it out is
 * exactly the old behaviour, `approvals.review` on the bearer.
 * @nullable
 */
approval?: string | null;
};
