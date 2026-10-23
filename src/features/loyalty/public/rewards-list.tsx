/**
 * What the programme pays out, and what each thing costs.
 *
 * The same list on the signup page (what you are joining for) and on the card
 * (what you can claim now), because a customer who reads one and then the
 * other should meet the same rewards in the same order at the same prices.
 * Empty renders nothing: a shop that has not priced a reward yet is not a
 * shop with an empty list to apologise for.
 *
 * The unit is the reader's, not the wire's. `cost_currency` says `"points"` or
 * `"visits"`; the page says points, or what a stamp counts here (orders, items,
 * stamps: `wording.ts`), in the reader's language and plural.
 */
import { useTranslation } from "react-i18next";
import { Gift } from "lucide-react";

import { unitNoun, type StampUnit } from "@/components/loyalty-card/wording";
import type { PublicReward } from "@/data/api/generated/models/publicReward";
import { fmtNumber } from "@/lib/format";

import { Panel, Section } from "./page-shell";

export function RewardsList({
  rewards,
  accent,
  unit,
}: {
  rewards: PublicReward[];
  accent: string;
  /** The programme's unit, for a reward priced in stamps. */
  unit: StampUnit;
}) {
  const { t } = useTranslation();
  if (rewards.length === 0) return null;

  return (
    <Section title={t("loyalty.whatYouCanClaim", "What you can claim")}>
      <Panel className="p-0">
        <ul className="divide-y divide-border/70">
          {rewards.map((r) => (
            <li key={`${r.name}-${r.cost_amount}`} className="flex items-center gap-3 px-5 py-3.5">
              <Gift className="size-[18px] shrink-0" style={{ color: accent }} aria-hidden />
              <span className="min-w-0 flex-1 text-[15px] font-medium leading-snug">
                <bdi>{r.name}</bdi>
              </span>
              {/* The figure in the mono cut, the word in the text's own. */}
              <span className="shrink-0 text-[13px] text-muted-foreground">
                <span className="font-mono tabular-nums">{fmtNumber(r.cost_amount)}</span>{" "}
                {unitNoun(t, r.cost_currency === "points" ? "points" : unit === "points" ? "order" : unit, r.cost_amount)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </Section>
  );
}
