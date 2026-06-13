/* eslint-disable */
// @ts-nocheck
import type { OnboardingStep } from './onboardingStep';

export interface OnboardingStatus {
  /** True when every `required` step is done (the Finish button enabler). */
  can_complete: boolean;
  /** Persisted terminal flag — the dashboard routes into the wizard
   * when this is false. */
  completed: boolean;
  /** @nullable */
  completed_at?: string | null;
  org_id: string;
  /** Recipe coverage across active menu items (0..1) — drives the cost
   * engine; surfaced separately because it's a percentage, not a bool. */
  recipe_coverage: number;
  steps: OnboardingStep[];
}
