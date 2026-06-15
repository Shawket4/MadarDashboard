/* eslint-disable */
// @ts-nocheck
import type { ZoneInputNameTranslations } from './zoneInputNameTranslations';

export interface ZoneInput {
  branch_id: string;
  fee: number;
  is_active?: boolean;
  max_road_distance_meters: number;
  name: string;
  name_translations?: ZoneInputNameTranslations;
}
