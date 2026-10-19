/* eslint-disable */
// @ts-nocheck

export type CheckLevel = typeof CheckLevel[keyof typeof CheckLevel];


export const CheckLevel = {
  blocking: 'blocking',
  advice: 'advice',
} as const;
