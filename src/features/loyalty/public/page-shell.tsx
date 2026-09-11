/**
 * The chrome both loyalty pages share.
 *
 * Signup and the member's card are one product to the customer — you scan a
 * code, you sign up, you get a card — so they come from one shell with one
 * rhythm: the shop's identity, a headline, a titled section per idea, then
 * Madar's footer. The page's own states live here too (loading, a notice, an
 * error with a retry), so neither page invents its own way of saying "not yet".
 *
 * ## Type does the work a display face used to
 * There is one family now, IBM Plex, in both scripts. Headlines are big and
 * weighted (`font-serif` is the display treatment: 600 and tight tracking, see
 * `globals.css`) and every figure sits in the mono cut with tabular digits.
 * That contrast — weight and scale against a quiet 15px body — is what carries
 * the hierarchy, and it holds identically in Arabic because it is the same
 * skeleton.
 *
 * ## Where the shop's colour is allowed to go
 * On the CARD, freely: it sits on the shop's own ground and that pair is
 * contrast-checked where it is derived. On the PAGE, only through
 * `brand.pageAccent` — the page follows the reader's light/dark choice, not the
 * shop's, so a raw brand colour has to read on paper AND on slate, and plenty
 * read on neither. Everything else stays on the app's own tokens: a shop
 * tinting its page is not a shop redefining what "readable text" means, and it
 * is also what keeps the Madar default looking finished rather than like a
 * fallback.
 */
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, RefreshCw, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";

import type { ResolvedBrand } from "../shared/brand";

/**
 * The page ground each theme paints — `--background` from `globals.css`, as
 * hex, because the AA arithmetic in `brand.ts` works on hex and a CSS token is
 * not a value until the browser resolves it. KEEP IN STEP with those tokens.
 *
 * The dark one used to be #0B0B0C, near-black, while the page actually paints
 * a blue-grey some four times as luminous. Contrast is a ratio against the
 * REAL ground: an accent that cleared 4.5:1 against the constant could land at
 * 3.7:1 on the page, and nothing would have said so.
 */
const GROUND = { light: "#EFF3F4", dark: "#14181E" } as const;

/** The brand accent, made legible against the theme in force. */
export function usePageAccent(brand: ResolvedBrand): string {
  const mode = usePublicTheme((s) => s.mode);
  return brand.pageAccent(GROUND[mode === "dark" ? "dark" : "light"]);
}

/**
 * One idea per section, with a real heading above it.
 *
 * A heading is not decoration here: the signup page asks a stranger for a
 * phone number, and a form that arrives unlabelled under a marketing paragraph
 * is one people abandon. Headings are the page's own ink, not the accent — the
 * accent is for the shop's moments (the eyebrow, icons, links), and a page
 * where every label shouts in brand colour has no quiet left for them.
 */
export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  /** One line under the heading, for a section that needs a sentence. */
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-semibold leading-tight tracking-[-0.01em]">{title}</h2>
        {hint ? <p className="text-[13px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * A bordered surface. One rule, so nothing on either page is a special case —
 * and the same rule `PhoneVerify` draws its own panel with, so the shared
 * phone step sits in this page as if it were written for it.
 */
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-card p-5 shadow-sm ${className}`}>
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
  /** Small line above the title — the branch, or the shop. */
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  const accent = usePageAccent(brand);

  // The tab is the one surface of the branding tier that still said "Madar"
  // to a shop's customers. The programme and the shop, in that order, because
  // a tab is truncated from the end.
  useEffect(() => {
    document.title = `${brand.programName} · ${brand.orgName}`;
  }, [brand.programName, brand.orgName]);

  return (
    <StorefrontShell brand={brand} product="loyalty">
      <div className="flex flex-col gap-8 pb-2 pt-3">
        <header className="flex flex-col gap-2.5">
          {eyebrow ? (
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-serif text-[32px] leading-[1.1] text-balance">{title}</h1>
          {intro ? (
            <div className="max-w-[38ch] text-[15px] leading-relaxed text-muted-foreground">
              {intro}
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </StorefrontShell>
  );
}

/**
 * What the page looks like before it knows whose it is. The same shape as the
 * page it becomes — an eyebrow, a headline, a card, a panel — so the swap is a
 * fill-in rather than a re-layout, and nothing jumps under a thumb already
 * reaching for the form.
 */
export function PageSkeleton() {
  return (
    <StorefrontShell product="loyalty">
      <div className="flex flex-col gap-8 pt-3" aria-busy>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-9 w-3/5 rounded-lg" />
          <Skeleton className="h-4 w-4/5 rounded-full" />
        </div>
        <Skeleton className="h-56 w-full rounded-[28px]" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </StorefrontShell>
  );
}

/**
 * The page has one thing to say and no form to show: the programme is off
 * here, the link matches no card, the request failed.
 *
 * Wears the shop's chrome when the shop is known — a branch with the programme
 * switched off is still that shop's page, and a customer should recognise
 * where they are even when there is nothing to do. A failed request has no
 * brand to wear, and says so in Madar's.
 */
export function PageNotice({
  brand,
  icon: Icon = AlertCircle,
  title,
  body,
  onRetry,
}: {
  brand?: ResolvedBrand | null;
  icon?: LucideIcon;
  title: string;
  body: string;
  /** Given, the notice is an ERROR and offers to try again. */
  onRetry?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <StorefrontShell brand={brand} product="loyalty">
      <div className="flex flex-col items-center gap-5 pt-14 text-center">
        <span className="grid size-16 place-items-center rounded-2xl border border-border/70 bg-card shadow-sm">
          <Icon className="size-7 text-muted-foreground" aria-hidden />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-[26px] leading-tight text-balance">{title}</h1>
          <p className="mx-auto max-w-[32ch] text-[15px] leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
        {onRetry ? (
          <Button variant="outline" size="lg" onClick={onRetry} className="rounded-full">
            <RefreshCw aria-hidden />
            {t("common.retry", "Retry")}
          </Button>
        ) : null}
      </div>
    </StorefrontShell>
  );
}
