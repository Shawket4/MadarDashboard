/**
 * The member's card as the teller sees it: the same object the customer has in
 * their wallet (the shop's colours, the present, the balance in the corner,
 * the segmented strip and the "rewards by madar" line at the foot), with the
 * name large enough to read across a counter.
 *
 * It is drawn from a list of tracks. One track (every card today) gets the
 * wide strip and one Complete button; two to four get a row each, with its
 * own name, count and Complete button, so a card that collects coffees and
 * pastries separately fits without a new screen.
 *
 * Colours are handed in (`cardColors`): the server guarantees the shop's
 * foreground clears AA on its ground, so filled steps, text and the button are
 * all drawn in the foreground, never in a colour this page picked.
 */
import { forwardRef, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { Gift } from "lucide-react";

import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

import { isolate, tNames } from "./bidi";
import { MAX_SEGMENTS, type Track, type cardColors } from "./util";

type Colors = ReturnType<typeof cardColors>;

export interface MemberCardProps {
  shopName: string;
  name: string;
  phone: string;
  tracks: Track[];
  colors: Colors;
  /** Completing is in flight for this track id. */
  redeeming?: string | null;
  disabled?: boolean;
  onRedeem: (track: Track) => void;
}

export const MemberCard = forwardRef<HTMLElement, MemberCardProps>(function MemberCard(
  { shopName, name, phone, tracks, colors, redeeming, disabled, onRedeem },
  ref,
) {
  const { t } = useTranslation();
  const single = tracks.length === 1 ? tracks[0] : null;
  const style = { "--card-bg": colors.bg, "--card-fg": colors.fg, backgroundColor: colors.bg, color: colors.fg } as CSSProperties;

  return (
    <section
      ref={ref}
      aria-label={t("rewardsTeller.cardOf", "{{name}}'s card", { name: isolate(name) })}
      className="relative isolate overflow-hidden rounded-[28px] p-5 shadow-[0_18px_40px_-20px_rgb(0_0_0/0.45)] sm:p-6"
      style={style}
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={colors.dark ? "/symbol-paper.svg" : "/symbol-ink.svg"} alt="" className="size-8 shrink-0" />
          <p className="truncate text-[15px] font-semibold">
            <bdi>{shopName}</bdi>
          </p>
        </div>
        {single ? (
          // The wallet's header field: the balance, top end.
          <div className="shrink-0 text-end leading-none">
            <p className="text-xs opacity-75">{t("rewardsTeller.stampsLabel", "Stamps")}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums" dir="ltr">
              {single.filled}/{single.size}
            </p>
          </div>
        ) : null}
      </header>

      <div className="mt-6 min-w-0">
        <h2 className="truncate text-[28px] font-semibold leading-tight tracking-[-0.01em]">
          <bdi>{name}</bdi>
        </h2>
        <p className="mt-0.5 font-mono text-sm opacity-80" dir="ltr">
          <span className="sr-only">{t("rewardsTeller.phone", "Phone")}: </span>
          <bdi>{formatPhoneDisplay(phone)}</bdi>
        </p>
      </div>

      {single ? (
        <div className="mt-6 space-y-3">
          <Strip track={single} label={t("rewardsTeller.stampsOf", "{{have}} of {{size}} stamps", { have: single.filled, size: single.size })} />
          <TrackLine track={single} />
          {single.canRedeem ? (
            <RedeemButton track={single} big busy={redeeming === single.id} disabled={disabled} onRedeem={onRedeem} />
          ) : null}
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {tracks.map((tr) => (
            <li key={tr.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate font-semibold">
                  <bdi>{tr.name}</bdi>
                </p>
                <p className="shrink-0 font-mono text-lg font-semibold tabular-nums" dir="ltr">
                  {tr.filled}/{tr.size}
                </p>
              </div>
              <Strip
                track={tr}
                compact
                label={t("rewardsTeller.trackStampsOf", "{{track}}: {{have}} of {{size}} stamps", {
                  track: isolate(tr.name),
                  have: tr.filled,
                  size: tr.size,
                })}
              />
              <div className="flex min-h-11 items-center justify-between gap-3">
                <TrackLine track={tr} />
                {tr.canRedeem ? (
                  <RedeemButton track={tr} busy={redeeming === tr.id} disabled={disabled} onRedeem={onRedeem} />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

    </section>
  );
});

/** The wallet strip: one segment per stamp up to twelve, a bar past that. */
function Strip({ track, label, compact }: { track: Track; label: string; compact?: boolean }) {
  const h = compact ? "h-2.5" : "h-4";
  const empty = { backgroundColor: "color-mix(in oklab, var(--card-fg) 20%, transparent)" };
  const fill = { backgroundColor: "var(--card-fg)" };
  if (track.size <= 0) return null;
  if (track.size > MAX_SEGMENTS) {
    const pct = Math.min(1, track.filled / track.size);
    return (
      <div role="img" aria-label={label} className={cn("w-full overflow-hidden rounded-full", h)} style={empty}>
        <div
          className="h-full rounded-full transition-transform duration-slow ease-out ltr:origin-left rtl:origin-right"
          style={{ ...fill, transform: `scaleX(${pct})` }}
        />
      </div>
    );
  }
  return (
    <div role="img" aria-label={label} className={cn("flex w-full", compact ? "gap-1" : "gap-1.5")}>
      {Array.from({ length: track.size }, (_, i) => (
        <span key={i} className={cn("relative flex-1 overflow-hidden rounded-full", h)} style={empty}>
          {/* Grows from the reading start when the stamp lands. */}
          <span
            className="absolute inset-0 rounded-full transition-transform duration-slow ease-out ltr:origin-left rtl:origin-right"
            style={{ ...fill, transform: `scaleX(${i < track.filled ? 1 : 0})` }}
          />
        </span>
      ))}
    </div>
  );
}

/** What happens next on this track, in one line. */
function TrackLine({ track }: { track: Track }) {
  const { t } = useTranslation();
  return (
    <p className="text-[15px] leading-snug">
      {track.canRedeem ? (
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Gift className="size-4" aria-hidden />
          {t("rewardsTeller.full", "Full: the reward is ready")}
        </span>
      ) : (
        t("rewardsTeller.toGo", { count: track.size - track.filled, defaultValue_one: "1 more stamp to a reward", defaultValue_other: "{{count}} more stamps to a reward" })
      )}
      {track.extra > 0 ? (
        <span className="opacity-80"> · {t("rewardsTeller.extra", "+{{count}} on the next card", { count: track.extra })}</span>
      ) : null}
    </p>
  );
}

function RedeemButton({
  track,
  big,
  busy,
  disabled,
  onRedeem,
}: {
  track: Track;
  big?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onRedeem: (track: Track) => void;
}) {
  const { t } = useTranslation();
  // Drawn in the card's own two colours, inverted: the one pairing the server
  // guarantees is readable on any shop's card.
  return (
    <button
      type="button"
      data-press="product"
      disabled={disabled || busy}
      onClick={() => onRedeem(track)}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-opacity outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_oklab,var(--card-fg)_45%,transparent)] disabled:opacity-60",
        big ? "h-14 w-full text-base" : "h-11 shrink-0 px-4 text-sm",
      )}
      style={{ backgroundColor: "var(--card-fg)", color: "var(--card-bg)" }}
    >
      <Gift className="size-5" aria-hidden />
      {track.name
        ? tNames(t, "rewardsTeller.redeemTrack", { defaultValue: "Complete {{track}}", track: track.name }, ["track"])
        : t("rewardsTeller.redeem", "Complete card")}
    </button>
  );
}
