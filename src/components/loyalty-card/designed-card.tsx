/**
 * A shop's DESIGNED card, drawn on the web exactly as its wallet pass: the
 * same madar-card design, grid, templates, stamp styles and EN/AR mirroring,
 * the strip drawn by the same SVG the server rasterises for Apple and Google
 * (`card_svg` from the lazy `card` wasm package), the fields laid out like
 * Apple's store card (the OS writes them in the system font there; here the
 * page's font does).
 *
 * Used by every surface that draws a card: the public join page and card
 * page, the teller's member card, Settings › Brand and the Rewards designer.
 * When the shop has no published design (`card` absent: the API's
 * `JoinInfo.card` / `CardView.card` / `ScanResult.card`), callers keep
 * drawing the classic card; [`LazyDesignedCard`] does that switch and only
 * then pays for the wasm.
 */
import { useTranslation } from "react-i18next";

import type { FieldSource, PublicCard } from "@/data/api/generated/models";
import type { CardRules, CardState } from "@/lib/rules/card";
import { cn } from "@/lib/utils";

import { StripSvg } from "./strip-svg";

export interface DesignedCardProps {
  rules: CardRules;
  card: PublicCard;
  /** Each track's balance (track 1 = the member's balance); absent = an empty card. */
  balances?: { position: number; balance: number }[];
  /** The Arabic card (`ar.lproj`): mirrored, Arabic words. Defaults to the page language. */
  arabic?: boolean;
  /** The shop (or programme) name the header shows beside the logo. */
  name: string;
  logoUrl?: string | null;
  photoUrl?: string | null;
  memberName?: string | null;
  className?: string;
}

/** The unit word of track 1's balance, by madar-card's `stamp_unit`. */
function unitLabel(t: (k: string, d: string) => string, unit: string): string {
  switch (unit) {
    case "points":
      return t("loyaltyCard.unit.points", "Points");
    case "item":
      return t("loyaltyCard.unit.item", "Items");
    case "stamp":
      return t("loyaltyCard.unit.stamp", "Stamps");
    default:
      return t("loyaltyCard.unit.order", "Orders");
  }
}

export function DesignedCard({ rules, card, balances, arabic, name, logoUrl, photoUrl, memberName, className }: DesignedCardProps) {
  const { t, i18n } = useTranslation();
  const ar = arabic ?? i18n.language.startsWith("ar");
  const tt = i18n.getFixedT(ar ? "ar" : "en") as unknown as (k: string, d: string) => string;
  const design = card.design;
  const c = design.colours;
  const size = (p: number) => (p === 1 ? card.track_one_size : (card.tracks.find((x) => x.position === p)?.size ?? 1));
  const balance = (p: number) => balances?.find((b) => b.position === p)?.balance ?? 0;
  const state: CardState = {
    arabic: ar,
    tracks: card.tracks.map((tr) => ({
      position: tr.position,
      size: size(tr.position),
      balance: balance(tr.position),
      colour: tr.colour ?? null,
      shape: tr.shape ?? null,
    })),
  };
  const trackName = (p: number, fallback: string) => {
    const tr = card.tracks.find((x) => x.position === p);
    const n = (ar ? tr?.name_ar || tr?.name_en : tr?.name_en || tr?.name_ar)?.trim();
    return n || fallback;
  };
  const text = (f: FieldSource): { label: string; value: string } | null => {
    if (f.type === "member") {
      return memberName ? { label: tt("loyaltyCard.member", "Member"), value: memberName } : null;
    }
    const step = rules.card_stepper(balance(f.track), size(f.track));
    if (f.type === "balance") {
      const fallback = f.track === 1 ? unitLabel(tt, card.stamp_unit) : tt("loyaltyCard.unit.stamp", "Stamps");
      return { label: trackName(f.track, fallback), value: String(balance(f.track)) };
    }
    if (f.type === "progress") return { label: trackName(f.track, name), value: step.progress };
    if (!step.earned) return null; // no row while nothing is earned, as on the pass
    const ready = tt("loyaltyCard.rewardReady", "Reward ready");
    return { label: f.track > 1 ? `${trackName(f.track, "")} · ${ready}` : ready, value: step.earned };
  };
  const field = (f: FieldSource, i: number, big = false) => {
    const x = text(f);
    if (!x) return null;
    return (
      <div key={i} className="min-w-0">
        <p className="truncate text-[10px] font-semibold tracking-wide uppercase" style={{ color: c.label }}>
          {x.label}
        </p>
        <p className={big ? "truncate text-3xl leading-tight" : "truncate text-sm"} style={{ color: c.foreground }}>
          {x.value}
        </p>
      </div>
    );
  };
  const below = [...(design.apple.secondary ?? []), ...(design.apple.auxiliary ?? [])];
  return (
    <div
      dir={ar ? "rtl" : "ltr"}
      role="group"
      aria-label={t("loyaltyCard.label", { defaultValue: "{{name}} card", name })}
      className={cn("w-full overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/10", className)}
      style={{ background: c.background, color: c.foreground }}
    >
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-8 max-w-28 object-contain" />
        ) : (
          <span className="truncate text-sm font-semibold">{name}</span>
        )}
        <div className="flex gap-3 text-end">{(design.apple.header ?? []).map((f, i) => field(f, i))}</div>
      </div>
      <div className="relative">
        <StripSvg
          rules={rules}
          design={design}
          state={state}
          store="apple"
          scale={2}
          photoUrl={photoUrl}
          logoUrl={logoUrl}
          primaryField={design.apple.primary != null}
          label={t("loyaltyCard.stripLabel", "Your progress on the card")}
        />
        {design.apple.primary ? <div className="absolute start-0 top-0 max-w-[66%] p-3">{field(design.apple.primary, 0, true)}</div> : null}
      </div>
      {below.length ? <div className="flex justify-between gap-3 px-3 py-2.5">{below.map((f, i) => field(f, i))}</div> : null}
    </div>
  );
}
