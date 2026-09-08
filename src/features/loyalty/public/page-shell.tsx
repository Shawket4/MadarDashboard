/**
 * The chrome both loyalty pages share.
 *
 * Signup and the member's card were built separately and looked it: one carried
 * a branded card on otherwise neutral chrome, the other led with a logo and a
 * serif heading, and the two agreed on almost nothing. They are one product to
 * the customer — you scan a code, you sign up, you get a card — so they now come
 * from one shell with one rhythm: identity, then a titled section per idea, then
 * Madar's footer.
 *
 * ## Where the shop's colour is allowed to go
 * On the CARD, freely: it sits on the shop's own ground and that pair is
 * contrast-checked where it is derived. On the PAGE, only through
 * `brand.pageAccent` — the page follows the reader's light/dark preference, not
 * the shop's, so a raw brand colour has to read on white AND on near-black, and
 * plenty read on neither.
 *
 * Everything else on the page stays on the app's own tokens. A shop tinting its
 * page is not a shop redefining what "readable text" means, and this is also
 * what keeps the Madar default looking finished rather than like a fallback:
 * with Madar's palette the same page is simply a Madar page.
 */
import type { ReactNode } from "react";

import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";

import type { ResolvedBrand } from "../shared/brand";

/** The page ground each theme actually paints, for contrast decisions. */
const GROUND = { light: "#FFFFFF", dark: "#0B0B0C" } as const;

/** The brand accent, made legible against the theme in force. */
export function usePageAccent(brand: ResolvedBrand): string {
  const mode = usePublicTheme((s) => s.mode);
  return brand.pageAccent(GROUND[mode === "dark" ? "dark" : "light"]);
}

/**
 * One idea per section, with a quiet title above it.
 *
 * A title is not decoration here: the signup page asks a stranger for a phone
 * number, and a form that arrives unlabelled under a marketing paragraph is one
 * people abandon.
 */
export function Section({
  title,
  children,
  accent,
}: {
  title?: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      {title ? (
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={accent ? { color: accent } : undefined}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

/** A bordered surface. One rule, so nothing on either page is a special case. */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-4 ${className}`}>
      {children}
    </div>
  );
}

/**
 * The page: the shop's identity, then whatever this page is, then Madar.
 *
 * `StorefrontShell` supplies the header chrome and the footer — the Madar mark
 * and "powered by" stay on every page at every tier.
 */
export function LoyaltyPage({
  brand,
  eyebrow,
  title,
  intro,
  children,
}: {
  brand: ResolvedBrand;
  /** Small line above the title — the branch, usually. */
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  const accent = usePageAccent(brand);

  return (
    <StorefrontShell brand={brand}>
      <div className="flex flex-col gap-7 pb-2 pt-2">
        <header className="flex flex-col gap-2">
          {eyebrow ? (
            <p
              className="text-[11px] font-medium uppercase tracking-[0.16em]"
              style={{ color: accent }}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-serif text-[28px] leading-tight">{title}</h1>
          {intro ? (
            <div className="text-sm leading-relaxed text-muted-foreground">{intro}</div>
          ) : null}
        </header>
        {children}
      </div>
    </StorefrontShell>
  );
}
