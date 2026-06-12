/* eslint-disable */
// @ts-nocheck

export type CmQuadrant = typeof CmQuadrant[keyof typeof CmQuadrant];


export const CmQuadrant = {
  star: 'star',
  plowhorse: 'plowhorse',
  puzzle: 'puzzle',
  dog: 'dog',
} as const;
