/* eslint-disable */
// @ts-nocheck

/**
 * One device (or device-less client) as last seen.
 */
export interface ClientSeen {
  /**
     * From an `X-Madar-Client` of the form `<app>/<semver>` only; `null` for
     * the dashboard and for any client identified by its User-Agent.
     * @nullable
     */
  app_version?: string | null;
  /** @nullable */
  branch_id?: string | null;
  /** @nullable */
  branch_name?: string | null;
  /**
     * `X-Madar-Client`; else `dashboard` for a browser; else the User-Agent.
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
