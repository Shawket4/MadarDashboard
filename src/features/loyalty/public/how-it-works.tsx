/**
 * The programme, in figures a person can read while the queue moves.
 *
 * Two tiles — what one order does, and what a reward costs — because the
 * sentence version ("Earn a point for every EGP 10 you spend, and 100 points
 * gets you a reward") is read twice by someone standing at a till and once by
 * someone reading tiles. The figures are set in the mono cut at display size
 * and the words stay small: the number is the thing being communicated.
 *
 * ## The mode decides what is drawn, not just what is said
 * A stamp programme is a card you can see filling up, so its tiles are
 * followed by the empty card: the same `StampRow` the member's card will draw,
 * in the page's own tokens. A points programme has nothing worth drawing at
 * zero — a 0% bar tells nobody anything — so it stops at the tiles. The wallet
 * pass makes the same choice (`wallet::google::MAX_STEPS`), so what is promised
 * here is what turns up in the phone.
 *
 * Reads only what `JoinInfo` carries. A cost of zero means the shop has not
 * priced a reward yet, and a tile saying "0 points for a reward" would be a
 * bug shown to a customer, so that tile is simply absent.
 */
import { useTranslation } from "react-i18next";

import type { JoinInfo } from "@/data/api/generated/models/joinInfo";
import { fmtMoney } from "@/lib/format";

import { Panel, Section } from "./page-shell";
import { StampRow, stampable } from "./stamp-row";

export function HowItWorks({
  info,
  accent,
}: {
  info: Pick<JoinInfo, "mode" | "next_reward_cost" | "earn_piastres_per_point">;
  /** The shop's accent, already made legible on this page. */
  accent: string;
}) {
  const { t } = useTranslation();
  const isVisits = info.mode === "visits";
  const target = info.next_reward_cost;

  const earn = isVisits
    ? { figure: 1, label: t("loyalty.tile.earnStamp", "stamp for every order") }
    : info.earn_piastres_per_point > 0
      ? {
          figure: 1,
          label: t("loyalty.tile.earnPoint", {
            defaultValue: "point for every {{amount}}",
            amount: fmtMoney(info.earn_piastres_per_point),
          }),
        }
      : null;
  const reward =
    target > 0
      ? {
          figure: target,
          label: isVisits
            ? t("loyalty.tile.rewardStamps", "stamps for a reward")
            : t("loyalty.tile.rewardPoints", "points for a reward"),
        }
      : null;

  const tiles = [earn, reward].filter((x): x is NonNullable<typeof x> => x !== null);
  if (tiles.length === 0) return null;

  return (
    <Section title={t("loyalty.howItWorks", "How it works")}>
      <Panel className="p-0">
        <ul className={`grid ${tiles.length === 2 ? "grid-cols-2 divide-x divide-border/70" : "grid-cols-1"}`}>
          {tiles.map((tile) => (
            // Figure first, then what it is: the order the eye reads a price
            // tag in, and — as one list item — the order a screen reader
            // speaks it: "1, point for every EGP 10".
            <li key={tile.label} className="flex flex-col gap-1 px-5 py-4">
              <span
                className="font-mono text-[34px] font-semibold leading-none tabular-nums"
                style={{ color: accent }}
              >
                {tile.figure}
              </span>
              <span className="text-[13px] leading-snug text-muted-foreground">{tile.label}</span>
            </li>
          ))}
        </ul>
        {isVisits && stampable(target) ? (
          // Illustrative, so hidden from the reader: the tiles above already
          // said "5 stamps", and "0 of 5 collected" is not news to someone who
          // has not joined yet.
          <div aria-hidden className="border-t border-border/70 px-5 py-4">
            <StampRow
              earned={0}
              target={target}
              accent={accent}
              onAccent="var(--card)"
              muted="var(--muted-foreground)"
            />
          </div>
        ) : null}
      </Panel>
    </Section>
  );
}
