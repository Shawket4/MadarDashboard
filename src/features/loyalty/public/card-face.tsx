/**
 * The membership card: the one object the customer thinks of as "my card".
 *
 * Laid out as a physical card rather than a page section — the shop's mark at
 * the top, the state of play in the middle, and the member's name along the
 * bottom edge like an embossed line. That shape is why the hierarchy reads
 * without instructions: identity, progress, ownership.
 *
 * ## One skeleton, both modes
 * Points and stamps say the same three things in the same three places: a
 * FIGURE (what you have), a DRAWING of the journey, and a SENTENCE naming what
 * happens next. Only the drawing differs — a stepper you can count, or a bar
 * where counting to 250 would be absurd. The card used to change shape between
 * the two, so a shop switching mode got what looked like a different product.
 *
 * The colours come from the ORG's logo (`orgs::branding` derives them at upload
 * and guarantees the text clears AA on whatever ground it produced), so this
 * component never decides a colour — it is handed one. A shop with no logo gets
 * Madar's palette, which is a finished card and not a fallback anyone would
 * notice as one.
 */
import { useTranslation } from "react-i18next";

import type { ResolvedBrand } from "../shared/brand";
import { StampRow, stampable } from "./stamp-row";

/**
 * Completed cards drawn before the rest become a count.
 *
 * Someone who has not claimed in months could be owed a dozen; a dozen full
 * rows is a wall, and the point of drawing them at all is that a small number
 * reads instantly.
 */
const MAX_COMPLETE_SHOWN = 3;

export function CardFace({
  brand,
  mode,
  balance,
  target,
  toGo,
  canRedeem,
  memberName,
  qrUrl,
  rewardsReady = 0,
  progress,
}: {
  brand: ResolvedBrand;
  mode: string;
  balance: number;
  target: number;
  toGo: number;
  canRedeem: boolean;
  memberName?: string | null;
  /** The member's code. Omitted where there is no member — the settings preview. */
  qrUrl?: string | null;
  /**
   * Rewards already earned and not yet claimed. A card does not stop at full:
   * six stamps against a five-stamp reward is one earned and one towards the
   * next, and showing only a full card tells someone their sixth visit did not
   * count.
   */
  rewardsReady?: number;
  /** Steps on the CURRENT card, after the earned ones are set aside. */
  progress?: number;
}) {
  const { t } = useTranslation();
  const isVisits = mode === "visits";
  const isSteps = isVisits && stampable(target);
  // What the live card shows. `progress` is the server's remainder; falling back
  // to the raw balance keeps an older payload rendering sensibly.
  const onCard = progress ?? balance;
  const pct =
    target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0;
  const unit = t(
    `loyalty.unit.${isVisits ? "orders" : "points"}`,
    isVisits ? "orders" : "points",
  );

  return (
    <section
      className="relative isolate overflow-hidden rounded-[28px] px-6 pb-5 pt-6 shadow-lg"
      style={{ backgroundColor: brand.background, color: brand.foreground }}
    >
      {/* Two blooms in the accent, so a flat fill reads as a printed card
          rather than a coloured rectangle — one catching the top corner, one
          weighting the base. Purely decorative, hence aria-hidden, and no state
          is ever carried by them. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-16 -top-24 -z-10 size-56 rounded-full opacity-[0.20]"
        style={{ backgroundColor: brand.accent }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -start-20 -z-10 size-56 rounded-full opacity-[0.10]"
        style={{ backgroundColor: brand.accent }}
      />

      <header className="flex items-center gap-3">
        {brand.logoUrl ? (
          // One rendering, on a plate, whatever kind of logo it is.
          //
          // This used to repaint a "mark" through a CSS `mask-image`, which is
          // the right idea and the wrong mechanism: when the mask does not
          // apply — and it silently did not, here, on Chrome for Android — the
          // element is masked to nothing and the shop's logo is simply absent
          // from its own card. A logo that sometimes disappears is worse than
          // one that always sits on a white tile.
          //
          // The tile also solves what the repainting was FOR. The ground is
          // derived from the logo's own dominant colour, so a logo drawn on it
          // is close to invisible by construction — blue on blue. An opaque
          // plate breaks that without touching the artwork, which is the same
          // answer both wallet passes reached.
          <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm">
            <img
              src={brand.logoUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {/* The shop's name is always here. Whose card this is must be on it,
              however little else has been configured. */}
          <p className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em]">
            {brand.orgName}
          </p>
          <p
            className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.16em]"
            style={{ color: brand.muted }}
          >
            {brand.programName}
          </p>
        </div>
      </header>

      {/* The band, where the wallets put it: under the header, across the card.
          Cropped rather than letterboxed, because bars down the sides of a
          photograph look like a mistake. */}
      {brand.cardImageUrl ? (
        <div className="-mx-6 mt-5 aspect-[2.6/1] overflow-hidden">
          <img
            src={brand.cardImageUrl}
            alt=""
            className="size-full object-cover"
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4">
        {/* The figure, in the mono cut: every number on this product is, and a
            balance that changes by one should not change width. Baseline-
            aligned so the unit sits on the numeral's foot rather than floating
            beside it. */}
        <p className="flex items-baseline gap-2">
          <span className="font-mono text-[56px] font-semibold leading-none tabular-nums">
            {isSteps ? onCard : balance}
          </span>
          <span
            className="min-w-0 truncate text-sm"
            style={{ color: brand.muted }}
          >
            {isSteps
              ? t("loyalty.ofTarget", {
                  defaultValue: "of {{n}} {{unit}}",
                  n: target,
                  unit,
                })
              : unit}
          </span>
        </p>

        {isSteps && rewardsReady > 0 ? (
          // The cards already filled. Drawn, not merely counted, because "you
          // have 2 rewards" and a row of completed steps are different
          // sentences — one is a number, the other is the thing they earned.
          <div className="flex flex-col gap-2">
            {Array.from(
              { length: Math.min(rewardsReady, MAX_COMPLETE_SHOWN) },
              (_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <StampRow
                    earned={target}
                    target={target}
                    accent={brand.accent}
                    onAccent={brand.background}
                    muted={brand.muted}
                  />
                </div>
              ),
            )}
            {rewardsReady > MAX_COMPLETE_SHOWN ? (
              <p className="text-xs" style={{ color: brand.muted }}>
                {t("loyalty.andMoreReady", {
                  defaultValue: "+{{n}} more ready",
                  n: rewardsReady - MAX_COMPLETE_SHOWN,
                })}
              </p>
            ) : null}
            {/* The line between what is finished and what is being collected. */}
            <div
              aria-hidden
              className="my-1 h-px w-full"
              style={{ backgroundColor: brand.muted, opacity: 0.4 }}
            />
          </div>
        ) : null}

        {isSteps ? (
          <StampRow
            earned={onCard}
            target={target}
            accent={brand.accent}
            onAccent={brand.background}
            muted={brand.muted}
          />
        ) : (
          // Decoration; the sentence beneath carries the fact. State never
          // rests on a graphic alone.
          <div
            aria-hidden
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: brand.muted, opacity: 0.35 }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${pct}%`, backgroundColor: brand.accent }}
            />
          </div>
        )}

        <p className="text-[15px] leading-snug">
          {rewardsReady > 0 ? (
            <span className="font-semibold">
              {t("loyalty.rewardsReadyN", {
                defaultValue_one: "1 reward earned — ask at the counter.",
                defaultValue_other:
                  "{{count}} rewards earned — ask at the counter.",
                count: rewardsReady,
              })}
            </span>
          ) : canRedeem ? (
            <span className="font-semibold">
              {t("loyalty.rewardReady", "Reward earned — ask at the counter.")}
            </span>
          ) : isVisits ? (
            t("loyalty.ordersToGo", {
              defaultValue: "{{n}} more orders to your next reward.",
              n: toGo,
            })
          ) : (
            t("loyalty.toGo", {
              defaultValue: "{{n}} more to your next reward.",
              n: toGo,
            })
          )}
        </p>
      </div>

      {memberName || qrUrl ? (
        // The embossed line and the code, in that order — the same order both
        // wallet passes use, fields above and the barcode at the foot. The code
        // used to live under the "add to wallet" buttons and only appear when
        // NO wallet could be offered, which is backwards: it is the thing the
        // till scans, and it works on every device. A card carries its own code.
        <footer
          className="mt-6 flex items-end justify-between gap-4 border-t pt-4"
          style={{ borderColor: brand.muted }}
        >
          {memberName ? (
            <div className="min-w-0 flex-1">
              <p
                className="text-[10px] font-medium uppercase tracking-[0.18em]"
                style={{ color: brand.muted }}
              >
                {t("loyalty.member", "Member")}
              </p>
              <p className="mt-0.5 truncate text-[13px] font-semibold uppercase tracking-[0.08em]">
                {memberName}
              </p>
            </div>
          ) : null}
          {qrUrl ? (
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              {/* On white whatever the card's ground: a scanner needs the
                  quiet zone and the contrast, and a QR tinted to match the
                  card is a QR that does not read. */}
              <img
                src={qrUrl}
                alt={t("loyalty.memberCodeAlt", "Your membership code")}
                className="size-[92px] rounded-lg bg-white p-1.5"
              />
              <span
                className="text-[9px] uppercase tracking-[0.14em]"
                style={{ color: brand.muted }}
              >
                {t("loyalty.scanAtCounter", "Scan at the counter")}
              </span>
            </div>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
