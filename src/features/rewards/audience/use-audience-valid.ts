import { useMemo } from "react";

import type { Rule } from "@/data/api/generated/models";

import { useCardRules } from "../use-card-rules";

/** True when the browser's checks find nothing wrong (the caller may still be waiting for the package). */
export function useAudienceValid(rules: Rule[], trackCount: number): boolean {
  const { rules: card } = useCardRules();
  return useMemo(
    () => !card || card.audience_validate({ rules }, Math.max(1, trackCount)).every((p) => p.severity !== "error"),
    [card, rules, trackCount],
  );
}
