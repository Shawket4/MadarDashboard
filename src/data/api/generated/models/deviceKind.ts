/* eslint-disable */
// @ts-nocheck

/**
 * OpenAPI-only vocabulary for `devices.kind` (CHECK `kind IN ('pos','kds','waiter')`).
 * The struct fields stay `String`, so the wire strings are unchanged.
 */
export type DeviceKind = typeof DeviceKind[keyof typeof DeviceKind];


export const DeviceKind = {
  pos: 'pos',
  kds: 'kds',
  waiter: 'waiter',
} as const;
