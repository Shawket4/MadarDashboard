/* eslint-disable */
// @ts-nocheck
import type { Triplet } from './triplet';

export interface BundleForecast {
  expected_velocity: Triplet;
  halo_units_x: number;
  incremental_cm?: null | Triplet;
  inside_bundle_units_x: number;
  total_units_uplift_x: number;
}
