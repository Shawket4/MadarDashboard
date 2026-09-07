/**
 * The membership card: the one object the customer thinks of as "my card".
 *
 * Laid out as a physical card rather than a page section — a tinted field with
 * the shop's mark at the top, the state of play in the middle, and the member's
 * name along the bottom edge like an embossed line. That shape is why the
 * hierarchy reads without instructions: identity, progress, ownership.
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
  const isSteps = mode === "visits" && stampable(target);
  const pct = target > 0 ? Math.min(100, Math.round((balance / target) * 100)) : 0;

  return (
    <section
      className="relative overflow-hidden rounded-[26px] px-6 pb-5 pt-7 shadow-lg"
      style={{ backgroundColor: brand.background, color: brand.foreground }}
    >
      {/* A soft bloom in the accent, so a flat fill reads as a printed card
          rather than a coloured rectangle. Purely decorative, hence aria-hidden
          and no contribution to any state. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-[0.18]"
        style={{ backgroundColor: brand.accent }}
      />

      <header className="relative flex items-center gap-3">
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt=""
            className="size-11 shrink-0 rounded-xl bg-white/90 object-contain p-1"
          />
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

      <div className="relative mt-7 flex flex-col items-center gap-4">
        {isSteps ? (
          <>
            <StampRow
              earned={balance}
              target={target}
              accent={brand.accent}
              onAccent={brand.background}
              muted={brand.muted}
            />
            <p className="text-center text-sm">
              {canRedeem ? (
                <span className="font-semibold">
                  {t("loyalty.rewardReady", "Reward earned — ask at the counter.")}
                </span>
              ) : (
                t("loyalty.ordersToGo", {
                  defaultValue: "{{n}} more orders to your next reward.",
                  n: toGo,
                })
              )}
            </p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[56px] leading-none tabular-nums">
                {balance}
              </span>
              <span className="text-sm" style={{ color: brand.muted }}>
                {t(
                  `loyalty.unit.${mode === "visits" ? "orders" : "points"}`,
                  mode === "visits" ? "orders" : "points",
                )}
              </span>
            </div>
            {/* Decoration; the sentence beneath carries the fact. State never
                rests on a graphic alone. */}
            <div
              aria-hidden
              className="h-2 w-full max-w-[260px] overflow-hidden rounded-full"
              style={{ backgroundColor: brand.muted, opacity: 0.35 }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                style={{ width: `${pct}%`, backgroundColor: brand.accent }}
              />
            </div>
            <p className="text-center text-sm">
              {canRedeem ? (
                <span className="font-semibold">
                  {t("loyalty.rewardReady", "Reward earned — ask at the counter.")}
                </span>
              ) : (
                t("loyalty.toGo", {
                  defaultValue: "{{n}} more to your next reward.",
                  n: toGo,
                })
              )}
            </p>
          </>
        )}
      </div>

      {memberName ? (
        <footer
          className="relative mt-6 flex items-center justify-between border-t pt-3 text-[11px] uppercase tracking-[0.14em]"
          style={{ borderColor: brand.muted, color: brand.muted }}
        >
          <span className="min-w-0 truncate">{memberName}</span>
          <span className="shrink-0 tabular-nums">
            {balance}
            {target > 0 ? ` / ${target}` : ""}
          </span>
        </footer>
      ) : null}
    </section>
  );
}
