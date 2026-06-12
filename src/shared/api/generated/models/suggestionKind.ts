/* eslint-disable */
// @ts-nocheck

export type SuggestionKind = typeof SuggestionKind[keyof typeof SuggestionKind];


export const SuggestionKind = {
  price: 'price',
  bundle: 'bundle',
  removal: 'removal',
} as const;
