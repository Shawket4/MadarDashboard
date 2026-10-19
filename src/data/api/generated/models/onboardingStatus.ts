/* eslint-disable */
// @ts-nocheck
import type { OnboardingStep } from './onboardingStep';

export interface OnboardingStatus {
  can_complete: boolean;
  /** Always true: old builds never open their wizard. */
  completed: boolean;
  /** @nullable */
  completed_at?: string | null;
  org_id: string;
  recipe_coverage: number;
  steps: OnboardingStep[];
}
