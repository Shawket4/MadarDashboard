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

import type { ResolvedBrand } from "./brand";
import { StampRow, stampable } from "./stamp-row";

export function CardFace({
  brand,
  mode,
  balance,
  target,
  toGo,
  canRedeem,
  memberName,
}: {
  brand: ResolvedBrand;
  mode: string;
  balance: number;
  target: number;
  toGo: number;
  canRedeem: boolean;
  memberName?: string | null;
}) {
  const { t } = useTranslation();
  const isVisits = mode === "visits";
  const isSteps = isVisits && stampable(target);
  const pct = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0;
  const unit = t(
    `loyalty.unit.${isVisits ? "orders" : "points"}`,
    isVisits ? "orders" : "points",
  );

  return (
    <section
      className="relative isolate overflow-hidden rounded-[26px] px-6 pb-5 pt-6 shadow-lg"
      style={{ backgroundColor: brand.background, color: brand.foreground }}
    >
      {/* Two blooms in the accent, so a flat fill reads as a printed card
          rather than a coloured rectangle — one catching the top corner, one
          weighting the base. Purely decorative, hence aria-hidden, and no state
          is ever carried by them. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 -z-10 size-56 rounded-full opacity-[0.20]"
        style={{ backgroundColor: brand.accent }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 -z-10 size-56 rounded-full opacity-[0.10]"
        style={{ backgroundColor: brand.accent }}
      />

      <header className="flex items-center gap-3">
        {brand.logoUrl ? (
          // A plate, because a logo is drawn for a light ground and would
          // disappear into a dark one. Hairline-edged so it still has a shape
          // when the card's own ground is pale.
          <span
            className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-1.5"
            style={{ boxShadow: `0 0 0 1px ${brand.muted}` }}
          >
            <img src={brand.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {/* The shop's name is always here. Whose card this is must be on it,
              however little else has been configured. */}
          <p className="truncate text-[15px] font-semibold leading-tight">
            {brand.orgName}
          </p>
          <p
            className="truncate text-[11px] uppercase tracking-[0.14em]"
            style={{ color: brand.muted }}
          >
            {brand.programName}
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-4">
        {/* The figure. Baseline-aligned so the unit sits on the numeral's foot
            rather than floating beside it. */}
        <p className="flex items-baseline gap-2">
          <span className="font-serif text-[52px] leading-none tabular-nums">
            {balance}
          </span>
          <span className="min-w-0 truncate text-sm" style={{ color: brand.muted }}>
            {isSteps
              ? t("loyalty.ofTarget", {
                  defaultValue: "of {{n}} {{unit}}",
                  n: target,
                  unit,
                })
              : unit}
          </span>
        </p>

        {isSteps ? (
          <StampRow
            earned={balance}
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

        <p className="text-sm">
          {canRedeem ? (
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

      {memberName ? (
        // The embossed line. Labelled, because a bare name on a card looks like
        // a caption for the thing above it rather than whose card this is.
        <footer
          className="mt-6 border-t pt-3"
          style={{ borderColor: brand.muted, opacity: 0.95 }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: brand.muted }}
          >
            {t("loyalty.member", "Member")}
          </p>
          <p className="truncate text-[13px] font-medium uppercase tracking-[0.08em]">
            {memberName}
          </p>
        </footer>
      ) : null}
    </section>
  );
}
