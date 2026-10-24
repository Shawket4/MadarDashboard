/**
 * The switch every card surface uses: a shop with a published design (the
 * API's optional `card`) gets [`DesignedCard`], loaded with the `card` wasm
 * package on first use; a shop without one gets `classic` (its existing card),
 * and the page downloads nothing extra: the designed card's code and the
 * package are one lazy chunk, fetched only when a design exists. A failed load
 * (offline) falls back to the classic card rather than an empty space.
 */
import { useEffect, useState, type ComponentType, type ReactNode } from "react";

import type { PublicCard } from "@/data/api/generated/models";
import { cardRules, type CardRules } from "@/lib/rules/card";

import { Skeleton } from "@/components/ui/skeleton";

import type { DesignedCardProps } from "./designed-card";

type Props = Omit<DesignedCardProps, "rules" | "card"> & {
  card: PublicCard | null | undefined;
  /** The classic card, drawn when there is no design (or the package cannot load). */
  classic: ReactNode;
};

/** The package and the component that draws with it, once loaded. */
export interface Designed {
  rules: CardRules;
  Card: ComponentType<DesignedCardProps>;
}

let loaded: Designed | undefined;
let loading: Promise<Designed> | undefined;

function loadDesigned(): Promise<Designed> {
  loading ??= Promise.all([cardRules(), import("./designed-card")]).then(
    ([rules, m]) => (loaded = { rules, Card: m.DesignedCard }),
    (e: unknown) => {
      loading = undefined;
      throw e;
    },
  );
  return loading;
}

/** Already loaded (tests initialise the package from disk): no round trip. */
const now = (): Designed | undefined => loaded;

/**
 * The designed card's code and package once a design needs them: `pending`
 * while they load (a page keeps its own skeleton up meanwhile, so nothing moves
 * when the card lands), `failed` when they could not (offline: draw the
 * classic card).
 */
export function useDesignedCard(needed: boolean): { designed: Designed | undefined; pending: boolean; failed: boolean } {
  const [designed, setDesigned] = useState<Designed | undefined>(now);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!needed || designed) return;
    let live = true;
    loadDesigned().then(
      (d) => live && setDesigned(d),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [needed, designed]);
  return { designed, pending: needed && !designed && !failed, failed };
}

export function LazyDesignedCard({ card, classic, ...rest }: Props) {
  const { designed, failed } = useDesignedCard(!!card);
  if (!card || failed) return <>{classic}</>;
  // Never the classic card first and the designed one a moment later: a
  // placeholder of the card's shape until the package is there.
  if (!designed) return <Skeleton className="aspect-[375/200] w-full max-w-sm rounded-2xl" />;
  return <designed.Card rules={designed.rules} card={card} {...rest} />;
}
