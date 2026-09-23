/* eslint-disable */
// @ts-nocheck

export interface StaffNotification {
  args: unknown;
  created_at: string;
  id: string;
  /** A core i18n key (`staff.n_*`); the app renders it with `args`. */
  key: string;
  /** @nullable */
  read_at?: string | null;
}
