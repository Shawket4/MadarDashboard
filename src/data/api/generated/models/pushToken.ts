/* eslint-disable */
// @ts-nocheck

export interface PushToken {
  /**
     * `ar` or `en`.
     * @nullable
     */
  locale?: string | null;
  /** The FCM registration token; empty turns pushes off for this phone. */
  token: string;
}
