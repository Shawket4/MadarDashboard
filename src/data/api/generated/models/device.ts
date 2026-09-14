/* eslint-disable */
// @ts-nocheck
import type { DeviceKind } from './deviceKind';

export interface Device {
  /** @nullable */
  app_version?: string | null;
  /** @nullable */
  branch_id?: string | null;
  code: string;
  /** Another live device at the same branch uses the same code. */
  code_conflict: boolean;
  first_seen_at: string;
  id: string;
  kind: DeviceKind;
  /** @nullable */
  label?: string | null;
  last_seen_at: string;
  org_id: string;
  /** @nullable */
  platform?: string | null;
  /** @nullable */
  retired_at?: string | null;
}
