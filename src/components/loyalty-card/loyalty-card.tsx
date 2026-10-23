/**
 * The loyalty card: the one object a customer thinks of as "my card", drawn
 * the same wherever it appears (the sign-up, the member's own page, the preview
 * in Settings › Brand).
 *
 * Laid out as a physical card: the shop at the top (its logo, its name, the
 * programme's name under it), the state of play in the middle, and the
 * member's name along the bottom edge with their code beside it. It is the
 * SHOP's card, so nothing on it is Madar's: Rewards by Madar signs the page's
 * footer instead. And it speaks in sentences, not labels: no "MEMBER" over the
 * name, no caption under the code, no tracked capitals anywhere.
 *
 * ## Stamps and points
 * A stamp programme draws its stamps and says how many are left; a points
 * programme prints its balance over a bar, because counting to 250 in circles
 * would be absurd. The line under either names what comes next in the
 * programme's own unit ("4 more items to your next reward"; `wording.ts`).
 *
 * ## The figures
 * Worked out here from the balance and the reward's cost by madar-loyalty's
 * rule (`rules.loyalty_card`, the WebAssembly build of the code the server's
 * own figures come from), so a caller hands over two numbers and the card can
 * never disagree with itself.
 *
 * ## Colours
 * From the shop's logo (`orgs::branding` derives them at upload and guarantees
 * the text clears AA on the ground it produced), resolved by `card-brand.ts`.
 * This component never chooses a colour. A shop with no logo gets Madar's
 * palette: a finished card, not a fallback.
 *
 * ## Designed cards
 * A shop that publishes a card design (Rewards › Card) is drawn by the designed
 * card, which falls back to this one while it has none. Several stamp tracks
 * always come with a design, so this card draws one track.
 */
import { useTranslation } from "react-i18next";
import { QrCode } from "lucide-react";

import { AssetImage } from "@/components/app/asset-image";
import { AnimatedNumber, Reveal, recipes } from "@/lib/motion";
import { rules } from "@/lib/rules";

import type { ResolvedBrand } from "./card-brand";
import { StampRow, stampable } from "./stamp-row";
import { stampUnit, toNextReward, unitNoun, type StampUnit } from "./wording";

/**
 * Completed cards drawn before the rest become a count.
 *
 * Someone who has not claimed in months could be owed a dozen; a dozen full
 * rows is a wall, and the point of drawing them at all is that a small number
 * reads instantly.
 */
const MAX_COMPLETE_SHOWN = 3;

/** The balance as the card prints it; whole while it counts. */
const wholeNumber = (n: number) => String(Number.isInteger(n) ? n : Math.round(n));

export interface LoyaltyCardMember {
  /** The member's name as they gave it. */
  name?: string | null;
  /** Shown, softened, where the name will go: the sign-up's card before anything is typed. */
  placeholder?: string;
  /** The member's code, which the till scans. */
  qrUrl?: string | null;
  /**
   * The code is on its way (the sign-up): its place is kept at its own size,
   * so it lands there without moving anything.
   */
  codePending?: boolean;
}

export interface LoyaltyCardProps {
  brand: ResolvedBrand;
  /** `"visits"` (a stamp card) or `"points"`, as the API sends it. */
  mode: string;
  /** What one stamp counts (`stampUnit`); worked out from `mode` when absent. */
  unit?: StampUnit;
  /** The member's balance: stamps, or points. */
  balance: number;
  /** The cheapest reward's cost (`next_reward_cost`): a full card, or the points it takes. */
  target: number;
  /** Whose card: the name along the bottom edge and the code beside it. Absent, the card has no foot. */
  member?: LoyaltyCardMember;
}

export function LoyaltyCard({ brand, mode, unit: given, balance, target, member }: LoyaltyCardProps) {
  const { t } = useTranslation();
  const unit = given ?? stampUnit(mode);
  const isSteps = mode === "visits" && stampable(target);
  // A card does not stop at full: six stamps against a five-stamp reward is
  // one earned and one towards the next. `progress` is what is on the CURRENT
  // card once the earned ones are set aside.
  const card = rules.loyalty_card(balance, target);
  const rewardsReady = card.rewards_ready;
  const pct = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0;
  const name = member?.name?.trim();

  return (
    // Card-sized wherever it is drawn: a phone's column already is, and in
    // Settings it would otherwise stretch across the whole pane.
    <section
      className="relative isolate w-full max-w-md overflow-hidden rounded-[28px] px-6 pb-6 pt-6 shadow-lg"
      style={{ backgroundColor: brand.background, color: brand.foreground }}
    >
      <header className="flex items-center gap-3">
        {brand.logoUrl ? (
          // One rendering, on a plate, whatever kind of logo it is. The ground
          // is derived from the logo's own dominant colour, so a logo drawn
          // straight on it is close to invisible by construction; the opaque
          // plate breaks that without touching the artwork, as both wallet
          // passes do. (A CSS mask that repainted the mark silently failed on
          // Chrome for Android and left the card with no logo at all.)
          <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm">
            <AssetImage legacyUrl={brand.logoUrl} sizes="44px" fit="contain" className="max-h-full max-w-full" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          {/* The shop's name is always here: whose card this is must be on
              it, however little else has been configured. */}
          {/* Names in <bdi>: a Latin name on an Arabic card ("Madar Coffee Co.")
              keeps its full stop at its own end. */}
          <p className="truncate text-[17px] font-semibold leading-tight tracking-[-0.01em]">
            <bdi>{brand.orgName}</bdi>
          </p>
          <p className="mt-0.5 truncate text-[13px] leading-tight" style={{ color: brand.muted }}>
            <bdi>{brand.programName}</bdi>
          </p>
        </div>
      </header>

      {/* The band, where the wallets put it: under the header, across the card.
          Cropped rather than letterboxed, because bars down the sides of a
          photograph look like a mistake. */}
      {brand.cardImageUrl ? (
        <div className="-mx-6 mt-5 aspect-[2.6/1] overflow-hidden">
          <AssetImage legacyUrl={brand.cardImageUrl} sizes="(max-width: 640px) 100vw, 512px" className="size-full" />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3.5">
        {isSteps ? (
          <>
            {rewardsReady > 0 ? (
              // The cards already filled. Drawn, not merely counted: "you have
              // 2 rewards" and a row of completed steps are different sentences.
              <div className="flex flex-col gap-2">
                {Array.from({ length: Math.min(rewardsReady, MAX_COMPLETE_SHOWN) }, (_, i) => (
                  <StampRow
                    key={i}
                    earned={target}
                    target={target}
                    unit={unit}
                    accent={brand.accent}
                    onAccent={brand.background}
                    muted={brand.muted}
                  />
                ))}
                {rewardsReady > MAX_COMPLETE_SHOWN ? (
                  <p className="text-[13px]" style={{ color: brand.muted }}>
                    {t("loyalty.andMoreReady", { defaultValue: "+{{n}} more ready", n: rewardsReady - MAX_COMPLETE_SHOWN })}
                  </p>
                ) : null}
                {/* The line between what is finished and what is being collected. */}
                <div aria-hidden className="my-1 h-px w-full" style={{ backgroundColor: brand.muted, opacity: 0.4 }} />
              </div>
            ) : null}
            <StampRow
              earned={card.progress_to_next}
              target={target}
              unit={unit}
              accent={brand.accent}
              onAccent={brand.background}
              muted={brand.muted}
            />
          </>
        ) : (
          <>
            {/* The balance, in the mono cut: every figure on this product is,
                and a balance that changes by one should not change width. */}
            <p className="flex items-baseline gap-2">
              <AnimatedNumber
                value={balance}
                format={wholeNumber}
                className="font-mono text-[44px] font-semibold leading-none tabular-nums"
              />
              <span className="min-w-0 truncate text-[15px]" style={{ color: brand.muted }}>
                {unitNoun(t, unit, balance)}
              </span>
            </p>
            {target > 0 ? (
              // Decoration; the sentence beneath carries the fact.
              <div
                aria-hidden
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, ${brand.muted} 35%, transparent)` }}
              >
                <div
                  className="h-full rounded-full transition-transform duration-brand ease-expo ltr:origin-left rtl:origin-right"
                  style={{ transform: `scaleX(${pct / 100})`, backgroundColor: brand.accent }}
                />
              </div>
            ) : null}
          </>
        )}

        {target > 0 ? (
          <p className="text-[15px] leading-snug">
            {rewardsReady > 0 ? (
              <span className="font-semibold">
                {t("loyalty.rewardsReadyN", {
                  defaultValue_one: "1 reward earned — ask at the counter.",
                  defaultValue_other: "{{count}} rewards earned — ask at the counter.",
                  count: rewardsReady,
                })}
              </span>
            ) : card.can_redeem ? (
              <span className="font-semibold">{t("loyalty.rewardReady", "Reward earned — ask at the counter.")}</span>
            ) : (
              toNextReward(t, unit, card.points_to_next_reward)
            )}
          </p>
        ) : null}
      </div>

      {member ? (
        // The name along the bottom edge and the code beside it, in the order
        // both wallet passes use. A card carries its own code: it is what the
        // till scans, and it works on every phone.
        <footer
          className="mt-6 flex items-end justify-between gap-4 border-t pt-4"
          style={{ borderColor: `color-mix(in srgb, ${brand.muted} 45%, transparent)` }}
        >
          <p
            className="min-w-0 truncate pb-0.5 text-[17px] font-medium leading-tight"
            style={name ? undefined : { color: brand.muted }}
          >
            <bdi>{name || member.placeholder}</bdi>
          </p>
          {member.qrUrl ? (
            // On white whatever the card's ground: a scanner needs the quiet
            // zone and the contrast. It lands with a pop where the sign-up kept
            // its place.
            <Reveal recipe={recipes.pop} className="size-[92px] shrink-0">
              <AssetImage
                legacyUrl={member.qrUrl}
                alt={t("loyalty.memberCodeAlt", "Your membership code")}
                fit="contain"
                className="size-[92px] rounded-lg bg-white p-1.5"
              />
            </Reveal>
          ) : member.codePending ? (
            <span
              aria-hidden
              className="grid size-[92px] shrink-0 place-items-center rounded-lg border border-dashed"
              style={{ borderColor: brand.muted, color: brand.muted }}
            >
              <QrCode className="size-8" strokeWidth={1.5} />
            </span>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
