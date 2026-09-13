/* eslint-disable */
// @ts-nocheck

/**
 * One device (or device-less client) as last seen.
 */
export interface ClientSeen {
  /**
     * Parsed from `client`; `null` when it carries no `<app>/<semver>`.
     * @nullable
     */
  app_version?: string | null;
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  branch_name?: string | null;
  /**
     * `X-Madar-Client`, else the User-Agent.
     * @nullable
     */
  client?: string | null;
  /**
     * The registered device's code, when the device is registered.
     * @nullable
     */
  device_code?: string | null;
  /** @nullable */
  device_id?: string | null;
  first_seen_at: string;
  /** @nullable */
  last_legacy_at?: string | null;
  /**
     * The latest legacy path kind (`legacy_shifts_route`, `replay_shift_id_field`, …).
     * @nullable
     */
  last_legacy_kind?: string | null;
  /** @nullable */
  last_legacy_path?: string | null;
  last_seen_at: string;
  /** Every legacy kind this client has hit. */
  legacy_kinds: string[];
}
