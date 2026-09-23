/* eslint-disable */
// @ts-nocheck

export interface RegisterPushDevice {
  /** Which app this device belongs to, e.g. `"dawam"`. */
  app: string;
  /**
     * `ar` or `en`; defaults to `ar`.
     * @nullable
     */
  locale?: string | null;
  /**
     * Free-form platform hint (`"ios"`, `"android"`, ...); optional.
     * @nullable
     */
  platform?: string | null;
  /** The FCM registration token. */
  token: string;
}
