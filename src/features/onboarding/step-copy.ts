import { useTranslation } from "react-i18next";

import { usePlan } from "@/hooks/use-plan";

/**
 * A step's words. A Free shop reads `free_<part>` when the step has one (the
 * branch step says "your branch", not "add your first": sign-up made it), and
 * every other reader, and every other part, the plain `<part>`.
 */
export function useStepCopy() {
  const { t, i18n } = useTranslation();
  const free = usePlan() === "free";
  return (step: string, part: string, fallback = ""): string => {
    const free_key = `onboarding.steps.${step}.free_${part}`;
    return free && i18n.exists(free_key) ? t(free_key) : t(`onboarding.steps.${step}.${part}`, fallback);
  };
}
