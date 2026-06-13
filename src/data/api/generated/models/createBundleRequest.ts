/* eslint-disable */
// @ts-nocheck
import type { CreateBundleComponentInput } from './createBundleComponentInput';

export interface CreateBundleRequest {
  /** @nullable */
  available_from_date?: string | null;
  /** @nullable */
  available_from_time?: string | null;
  /** @nullable */
  available_until_date?: string | null;
  /** @nullable */
  available_until_time?: string | null;
  /** @nullable */
  branch_ids?: string[] | null;
  components: CreateBundleComponentInput[];
  /** @nullable */
  description?: string | null;
  description_translations?: unknown;
  /** @nullable */
  image_url?: string | null;
  name: string;
  name_translations?: unknown;
  org_id: string;
  price: number;
}
