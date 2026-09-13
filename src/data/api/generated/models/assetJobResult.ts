/* eslint-disable */
// @ts-nocheck
import type { AssetRef } from './assetRef';

export interface AssetJobResult {
  full?: null | AssetRef;
  pos: AssetRef;
  variants: AssetRef[];
}
