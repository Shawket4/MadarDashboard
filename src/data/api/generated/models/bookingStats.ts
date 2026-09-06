/* eslint-disable */
// @ts-nocheck

export interface BookingStats {
  cancelled: number;
  completed: number;
  /** Guests across bookings that were seated or completed. */
  covers: number;
  host_count: number;
  no_show: number;
  /** no_show / (no_show + seated + completed), 0 when nothing happened. */
  no_show_rate: number;
  public_count: number;
  seated: number;
  total: number;
}
