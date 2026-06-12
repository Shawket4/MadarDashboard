/* eslint-disable */
// @ts-nocheck
import type { AbsorbedBy } from './absorbedBy';
import type { ComplementaryLoss } from './complementaryLoss';
import type { ItemKey } from './itemKey';
import type { RemovalRecommendation } from './removalRecommendation';

export interface RemovalScenario {
  absorbed_by: AbsorbedBy[];
  baseline_cm: number;
  complementary_losses: ComplementaryLoss[];
  explanation: string;
  item_name: string;
  key: ItemKey;
  net_cm_change: number;
  net_cm_change_hi: number;
  net_cm_change_lo: number;
  recommendation: RemovalRecommendation;
}
