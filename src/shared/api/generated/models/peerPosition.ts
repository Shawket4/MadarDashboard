/* eslint-disable */
// @ts-nocheck

export type PeerPosition = typeof PeerPosition[keyof typeof PeerPosition];


export const PeerPosition = {
  above: 'above',
  at: 'at',
  below: 'below',
} as const;
