/* eslint-disable */
// @ts-nocheck

export interface PingResult {
  /** At 15% or less during a shift: tell them to charge (CL-12). */
  charge_phone: boolean;
  distance_meters: number;
  /** Flags this ping raised: `left_mid_shift`, `suspicious`. */
  flags: string[];
  inside: boolean;
}
