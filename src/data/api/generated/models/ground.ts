/* eslint-disable */
// @ts-nocheck
import type { GroundKind } from './groundKind';
import type { Pattern } from './pattern';

export interface Ground {
  kind: GroundKind;
  pattern?: null | Pattern;
}
