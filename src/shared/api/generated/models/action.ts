/* eslint-disable */
// @ts-nocheck

export type Action = typeof Action[keyof typeof Action];


export const Action = {
  hold: 'hold',
  raise_price: 'raise_price',
  lower_price: 'lower_price',
  bundle: 'bundle',
  remove: 'remove',
  reformulate: 'reformulate',
  monitor: 'monitor',
} as const;
