/* eslint-disable */
// @ts-nocheck
import type { BundleStatus } from './bundleStatus';

export interface Bundle {
  /** @nullable */
  available_from_date?: string | null;
  /** @nullable */
  available_from_time?: string | null;
  /** @nullable */
  available_until_date?: string | null;
  /** @nullable */
  available_until_time?: string | null;
  created_at: string;
  /** @nullable */
  created_by?: string | null;
  /** @nullable */
  description?: string | null;
  description_translations: unknown;
  display_order: number;
  id: string;
  /** @nullable */
  image_url?: string | null;
  name: string;
  name_translations: unknown;
  org_id: string;
  price: number;
  status: BundleStatus;
  updated_at: string;
}
