/**
 * madar-shared's `card` package (madar-card) for a Rewards page: the
 * designer's templates, validation and SVG, the tracks', audiences' and
 * messages' checks. It loads when the first page that needs it opens.
 */
import { useEffect, useState } from "react";

import { cardRules, cardRulesNow, type CardRules } from "@/lib/rules/card";

export function useCardRules(): { rules: CardRules | undefined; failed: boolean; retry: () => void } {
  const [rules, setRules] = useState<CardRules | undefined>(cardRulesNow);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (rules) return;
    let live = true;
    cardRules().then(
      (r) => live && setRules(r),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [rules, attempt]);
  return {
    rules,
    failed,
    retry: () => {
      setFailed(false);
      setAttempt((n) => n + 1);
    },
  };
}
