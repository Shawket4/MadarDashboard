/* eslint-disable */
// @ts-nocheck

/**
 * What lies under the elements.
 */
export type GroundKind = typeof GroundKind[keyof typeof GroundKind];


export const GroundKind = {
  colour: 'colour',
  photo: 'photo',
  pattern: 'pattern',
} as const;
