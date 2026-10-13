/* eslint-disable */
// @ts-nocheck

/**
 * What the plan allows: `{features: [..], limits: {branches,
 * pos_devices_per_branch, kds_devices, waiter_devices}, realtime}`
 * (madar-plan's `Entitlements`). A limit that is `null` is unlimited.
 */
export type PlanStateEntitlements = { [key: string]: unknown };
