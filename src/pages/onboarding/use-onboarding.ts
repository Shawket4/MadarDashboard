import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetOnboarding,
  useCompleteOnboarding,
  getGetOnboardingQueryKey,
} from "@/shared/api/generated/api";
import type { OnboardingStatus, OnboardingStep } from "@/shared/api/generated/models";

/**
 * Step progress is derived server-side from data presence on every read —
 * there is no "mark step done" client call, and `done` can regress (deleting
 * the only branch un-checks the branch step). Never cache step state beyond
 * the short staleTime below; only `completed` is a persisted terminal flag.
 */
export const useOnboardingStatus = (orgId: string | null | undefined) =>
  useGetOnboarding(orgId ?? "", {
    query: { enabled: !!orgId, staleTime: 30_000 },
  });

export const useCompleteOnboardingMutation = () => useCompleteOnboarding();

/** Refetch the wizard stepper after any create mutation inside the wizard. */
export const useInvalidateOnboarding = (orgId: string | null | undefined) => {
  const qc = useQueryClient();
  return useCallback(() => {
    if (orgId) qc.invalidateQueries({ queryKey: getGetOnboardingQueryKey(orgId) });
  }, [qc, orgId]);
};

/** Wizard page order. Indexes are the ?step= values. */
export const WIZARD_STEPS = [
  { index: 0, keys: [] as string[], titleKey: "onboarding.steps.welcome" },
  { index: 1, keys: ["branch"], titleKey: "onboarding.steps.branch" },
  { index: 2, keys: ["payment_methods"], titleKey: "onboarding.steps.payments" },
  { index: 3, keys: ["categories", "menu_items"], titleKey: "onboarding.steps.menu" },
  { index: 4, keys: ["ingredients", "recipes"], titleKey: "onboarding.steps.costs" },
  { index: 5, keys: ["addons"], titleKey: "onboarding.steps.addons" },
  { index: 6, keys: ["team"], titleKey: "onboarding.steps.team" },
  { index: 7, keys: [], titleKey: "onboarding.steps.review" },
] as const;

export const stepByKey = (status: OnboardingStatus | undefined, key: string): OnboardingStep | undefined =>
  status?.steps.find((s) => s.key === key);

/** A wizard page is "done" when every backend step it covers is done. */
export const isWizardStepDone = (status: OnboardingStatus | undefined, index: number): boolean => {
  const page = WIZARD_STEPS[index];
  if (!page || page.keys.length === 0) return false;
  return page.keys.every((k) => stepByKey(status, k)?.done);
};

/** First wizard page whose required backend steps are not done (for resume). */
export const firstIncompleteRequiredStep = (status: OnboardingStatus | undefined): number => {
  for (const page of WIZARD_STEPS) {
    if (page.keys.length === 0) continue;
    const requiredUndone = page.keys.some((k) => {
      const s = stepByKey(status, k);
      return s?.required && !s.done;
    });
    if (requiredUndone) return page.index;
  }
  return WIZARD_STEPS.length - 1; // everything required done → review
};

/** True when the org has any data at all (used for "picking up where you left off"). */
export const hasAnyProgress = (status: OnboardingStatus | undefined): boolean =>
  !!status?.steps.some((s) => s.done);

