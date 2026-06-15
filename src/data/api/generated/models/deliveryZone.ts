/* eslint-disable */
// @ts-nocheck
import type { DeliveryZoneNameTranslations } from './deliveryZoneNameTranslations';

export interface DeliveryZone {
  branch_id: string;
  fee: number;
  id: string;
  is_active: boolean;
  max_road_distance_meters: number;
  name: string;
  name_translations: DeliveryZoneNameTranslations;
}
