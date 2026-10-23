/* eslint-disable */
// @ts-nocheck

export type MemberSort = typeof MemberSort[keyof typeof MemberSort];


export const MemberSort = {
  joined: 'joined',
  last_visit: 'last_visit',
  balance: 'balance',
  name: 'name',
} as const;
