/* eslint-disable */
// @ts-nocheck

/**
 * What a button is. The four modules are a closed list, like the social
 * platforms: each one is a page we serve, and `custom` is the shop's own link.
 */
export type LinksItemKind = typeof LinksItemKind[keyof typeof LinksItemKind];


export const LinksItemKind = {
  order: 'order',
  menu: 'menu',
  rewards: 'rewards',
  book: 'book',
  custom: 'custom',
} as const;
