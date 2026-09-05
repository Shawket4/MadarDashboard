/* eslint-disable */
// @ts-nocheck
import type { SlotAvailability } from './slotAvailability';

export interface AvailabilityResponse {
  date: string;
  slots: SlotAvailability[];
  timezone: string;
}
