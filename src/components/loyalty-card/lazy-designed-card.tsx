/**
 * The switch every card surface uses: a shop with a published design (the
 * API's optional `card`) gets [`DesignedCard`], loaded with the `card` wasm
 * package on first use (a card-shaped skeleton meanwhile); a shop without one
 * gets `classic` (its existing CardFace), and the page downloads nothing
 * extra. A failed load (offline) falls back to the classic card rather than
 * an empty space.
 */
import { useEffect, useState, type ReactNode } from "react";

import type { PublicCard } from "@/data/api/generated/models";
import { cardRules, cardRulesNow, type CardRules } from "@/lib/rules/card";

import { Skeleton } from "@/components/ui/skeleton";

import { DesignedCard, type DesignedCardProps } from "./designed-card";

type Props = Omit<DesignedCardProps, "rules" | "card"> & {
  card: PublicCard | null | undefined;
  /** The classic card, drawn when there is no design (and while the package loads). */
  classic: ReactNode;
};

export function LazyDesignedCard({ card, classic, ...rest }: Props) {
  const [rules, setRules] = useState<CardRules | undefined>(cardRulesNow);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!card || rules) return;
    let live = true;
    cardRules().then(
      (r) => live && setRules(r),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [card, rules]);
  if (!card || failed) return <>{classic}</>;
  // Never the classic card first and the designed one a moment later: a
  // placeholder of the card's shape until the package is there.
  if (!rules) return <Skeleton className="aspect-[375/200] w-full max-w-sm rounded-2xl" />;
  return <DesignedCard rules={rules} card={card} {...rest} />;
}
