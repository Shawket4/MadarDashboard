/**
 * The only thing an iOS visitor inside Instagram can usefully be shown.
 *
 * A `.pkpass` is a file the operating system has to claim, and an in-app
 * webview cannot hand one to Wallet. There is no redirect, URL scheme or header
 * that escapes an in-app browser on iOS — the customer has to leave it through
 * the host app's own menu.
 *
 * So the whole flow is replaced rather than decorated. Letting someone sign up
 * here would work right up until the last tap and then fail silently, leaving a
 * member row, an unusable page, and a customer who thinks the shop's card is
 * broken. Better to spend their attention once, on the one action that leads
 * somewhere.
 *
 * ## Whose page it is
 * It wears the same shell as the pages it stands in for (`StorefrontShell`, the
 * loyalty signature, the headline treatment of `LoyaltyPage`) so the customer
 * is not bounced to a different-looking site the moment the link opens. It
 * renders at the root, before the router has parsed anything, so it finds the
 * shop the same way the pages it replaces would: the branch or org in the path
 * (`/join/:branchId`, `/join/org/:orgId`), else the shop behind the hostname.
 * Found, the shop's mark goes in the header and its accent is rebound onto
 * `--primary` for this subtree — exactly what `LoyaltyPage` does — so the
 * demonstration below performs in the shop's colour. Not found (our generic
 * hosts, a card link, a request that failed), the page is Madar's, which is a
 * finished page and not an error.
 *
 * ## The gesture, demonstrated
 * Prose cannot show WHERE a button is, so the panel opens with a looping
 * demonstration of the two taps: a fingertip travels to the `···` in the host
 * app's bar and taps it, the menu rises, the fingertip moves to the row to
 * pick, taps, and the loop breathes and repeats. It is a drawing of what the
 * customer is looking at, one screen up, so they can copy it without reading;
 * the numbered steps under it carry the same instruction as text and are what
 * a screen reader gets (the stage is `aria-hidden`).
 *
 * The whole thing is CSS keyframes on `transform` and `opacity` — no library,
 * no timers — hoisted from this file through React's `<style>` de-duplication
 * so the page's only motion lives beside the markup it moves. The fingertip is
 * anchored to the END corner and its path is multiplied by `--flip`, which
 * `[dir=rtl]` sets to -1: under an Arabic locale iOS puts the `···` in the
 * other corner and the demonstration follows it without a second set of
 * keyframes.
 *
 * Under `prefers-reduced-motion` every animation is switched off, and the
 * resting state of each element IS the static lesson: the menu already open
 * under the `···`, the target row outlined, nothing moving. Not a blank.
 *
 * The menu row's label says "Open in Safari" — this page only ever renders on
 * iOS, so Safari is where every one of these menus leads — but it is still an
 * EXAMPLE: Instagram's row reads "Open in browser", others "Open in external
 * browser", and a page that states one label as fact is wrong for the rest. So
 * the hint under step two says the wording varies rather than pretending not.
 *
 * ## Android
 * Android is sent here too, but as a FALLBACK: `src/loyalty/main.tsx` first
 * tries `escapeToBrowserOnce`, an `intent://` hand-off to the default browser.
 * When that takes, the customer is already gone and this page is what the
 * webview shows behind them; when it does not, this page is the instruction.
 * The wording is Android's own — the menu is `⋮` (three vertical dots) and
 * the row reads "Open in Chrome" or "Open in browser" — under separate i18n
 * keys, because iOS's `···` and "Open in Safari" are simply wrong there. The
 * demonstration is the same choreography with the glyph and the row swapped;
 * on both platforms the menu sits at the END corner, so the RTL flip holds.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Compass, Copy, Globe, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLoyaltyJoinInfo } from "@/data/api/generated/api";
import { StorefrontShell } from "@/features/public-shell/storefront-shell";
import { useHostOrg } from "@/features/public-shell/use-brand";

import { resolveBrand, type ResolvedBrand } from "../shared/brand";
import { Panel } from "./page-shell";

/**
 * The shop this link belongs to, from the only clues a root-level page has.
 *
 * Returns `null` until it knows, or for good when there is no shop to find.
 * The join-info request is the same one the sign-up page would have made, so
 * on a real link it is answered from cache the moment the customer comes back
 * in Safari.
 */
function useLinkBrand(): ResolvedBrand | null {
  const { i18n } = useTranslation();
  const path = typeof window === "undefined" ? "" : window.location.pathname;
  const branchId = /^\/join\/(?!org\/)([^/]+)/.exec(path)?.[1] ?? null;
  const pathOrgId = /^\/join\/org\/([^/]+)/.exec(path)?.[1] ?? null;
  const host = useHostOrg();
  const orgId = pathOrgId ?? host.orgId;

  const params = branchId ? { branch_id: branchId } : orgId ? { org_id: orgId } : undefined;
  const info = useLoyaltyJoinInfo(params, {
    query: { enabled: !!params, staleTime: 5 * 60_000, retry: false },
  });
  const brand = info.data?.brand;
  return brand ? resolveBrand(brand, i18n.resolvedLanguage ?? "en") : null;
}

/**
 * The choreography. One 4s loop; the percentages below are its clock.
 *
 *   0–14   fingertip rises into view and travels up to the `···`
 *   15–20  tap: fingertip presses, ripple leaves the `···`, button dips
 *   20–28  the menu rises
 *   28–42  fingertip travels to the target row
 *   43–48  tap: press, ripple, row lights up
 *   48–70  hold — the customer gets to see where it landed
 *   70–80  everything fades
 *   80–100 a short breath, then again
 *
 * Geometry is in px against a stage whose bar is 40px tall with the `···`
 * centred 18px in from the end edge; the menu sits 56px down, its target row
 * centred 148px down. The fingertip is 28px and anchored with its top-end
 * corner at the stage's, so "centre it on (x, y)" is
 * `translate(flip * -(x - 14), y - 14)`. It lands on the lower-inward RIM of
 * the `···`, like a thumb pad — centred on it, it would hide the very button
 * it is pointing at; clear of it, it would look like a miss.
 */
const LOOP = "4s";
const DEMO_CSS = `
.ios-demo { --flip: 1; }
[dir="rtl"] .ios-demo { --flip: -1; }

/* Resting state doubles as the reduced-motion lesson: menu open, row lit. */
.ios-demo__menu { opacity: 1; transform: none; }
.ios-demo__row--target {
  border-color: var(--primary);
  background: color-mix(in oklab, var(--primary) 12%, var(--card));
}
.ios-demo__finger, .ios-demo__ripple { opacity: 0; }

@media (prefers-reduced-motion: no-preference) {
  .ios-demo__finger { animation: ios-demo-finger ${LOOP} cubic-bezier(0.55, 0, 0.15, 1) infinite; }
  .ios-demo__ripple--dots { animation: ios-demo-ripple ${LOOP} cubic-bezier(0.2, 0.6, 0.3, 1) infinite; }
  .ios-demo__ripple--row {
    animation: ios-demo-ripple ${LOOP} cubic-bezier(0.2, 0.6, 0.3, 1) infinite;
    animation-delay: -1.12s; /* the same ripple, fired at 43% instead of 15% */
  }
  .ios-demo__dots { animation: ios-demo-press ${LOOP} ease-out infinite; }
  .ios-demo__menu { animation: ios-demo-menu ${LOOP} cubic-bezier(0.2, 0.8, 0.2, 1) infinite; }
  .ios-demo__row--target { animation: ios-demo-row ${LOOP} ease-out infinite; }
}

@keyframes ios-demo-finger {
  0%   { opacity: 0; transform: translate(calc(var(--flip) * -26px), 190px) scale(0.9); }
  5%   { opacity: 1; }
  14%  { transform: translate(calc(var(--flip) * -14px), 14px) scale(1); }
  16%  { transform: translate(calc(var(--flip) * -14px), 14px) scale(0.8); }
  20%  { transform: translate(calc(var(--flip) * -14px), 14px) scale(1); }
  28%  { transform: translate(calc(var(--flip) * -14px), 14px) scale(1); }
  42%  { transform: translate(calc(var(--flip) * -26px), 138px) scale(1); }
  44%  { transform: translate(calc(var(--flip) * -26px), 138px) scale(0.8); }
  48%  { transform: translate(calc(var(--flip) * -26px), 138px) scale(1); }
  70%  { opacity: 1; transform: translate(calc(var(--flip) * -26px), 138px) scale(1); }
  80%, 100% { opacity: 0; transform: translate(calc(var(--flip) * -26px), 190px) scale(0.9); }
}
@keyframes ios-demo-ripple {
  0%, 15%   { opacity: 0; transform: scale(0.5); }
  16%       { opacity: 0.55; transform: scale(0.6); }
  28%, 100% { opacity: 0; transform: scale(2.6); }
}
@keyframes ios-demo-press {
  0%, 15%, 20%, 100% { transform: scale(1); }
  16%                { transform: scale(0.86); }
}
@keyframes ios-demo-menu {
  0%, 20%   { opacity: 0; transform: translateY(12px) scale(0.96); }
  28%, 70%  { opacity: 1; transform: none; }
  80%, 100% { opacity: 0; transform: translateY(12px) scale(0.96); }
}
@keyframes ios-demo-row {
  0%, 43%   { border-color: transparent; background: transparent; }
  46%, 72%  { border-color: var(--primary); background: color-mix(in oklab, var(--primary) 12%, var(--card)); }
  80%, 100% { border-color: transparent; background: transparent; }
}
`;

/**
 * The looping demonstration: the host app's bar, the menu that opens from its
 * `···`, and a fingertip performing the two taps.
 */
export type EscapePlatform = "ios" | "android";

function GestureDemo({
  app,
  label,
  platform,
}: {
  app: string;
  label: string;
  platform: EscapePlatform;
}) {
  const android = platform === "android";
  const RowIcon = android ? Globe : Compass;
  const row = "flex h-8 items-center gap-2.5 rounded-lg border-2 border-transparent px-2.5";
  return (
    <div aria-hidden className="ios-demo relative h-[176px] overflow-hidden">
      <style href="loyalty-ios-demo" precedence="default">
        {DEMO_CSS}
      </style>

      {/* The bar the customer is looking at right now, one screen up. */}
      <div className="flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-background px-2.5">
        <span className="text-[11px] font-semibold text-muted-foreground">{app}</span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1.5">
          <Lock className="size-3 shrink-0 text-muted-foreground" />
          <span className="h-1.5 w-2/5 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="relative grid size-8 shrink-0 place-items-center">
          <span className="ios-demo__ripple ios-demo__ripple--dots absolute inset-0 rounded-full bg-primary/40" />
          <span className="ios-demo__dots relative grid size-8 place-items-center rounded-full bg-card text-[16px] font-semibold leading-none tracking-[0.02em] text-foreground">
            {android ? "⋮" : "···"}
          </span>
        </span>
      </div>

      {/* The sheet that opens under it. Bare bars for the rows the customer
          skims past — the real menu differs per app, and an invented "Share"
          above the right row is one more thing that would not match. */}
      <div className="ios-demo__menu absolute end-0 top-14 flex w-[62%] flex-col gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-lg">
        <span className={row}>
          <span className="size-4 rounded-full bg-muted-foreground/25" />
          <span className="h-1.5 w-1/3 rounded-full bg-muted-foreground/25" />
        </span>
        <span className={row}>
          <span className="size-4 rounded-full bg-muted-foreground/25" />
          <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/25" />
        </span>
        <span className={`ios-demo__row--target ${row} text-[13px] font-medium text-foreground`}>
          <RowIcon className="size-4 shrink-0 text-primary" />
          <span className="truncate">{label}</span>
        </span>
      </div>

      {/* Tap ripple at the row, and the fingertip: a ring of the accent with a
          solid centre, so it reads as a touch and not as a cursor. Both are
          anchored at the END corner and moved by transform only, so RTL is a
          sign flip. */}
      <span className="ios-demo__ripple ios-demo__ripple--row absolute end-[26px] top-[138px] size-7 rounded-full bg-primary/40" />
      <span className="ios-demo__finger absolute end-0 top-0 grid size-7 place-items-center rounded-full border-2 border-primary bg-primary/25 shadow-md backdrop-blur-[1px]">
        <span className="size-2.5 rounded-full bg-primary" />
      </span>
    </div>
  );
}

export function OpenInSafariPage({
  app,
  platform = "ios",
}: {
  app: string;
  platform?: EscapePlatform;
}) {
  const { t } = useTranslation();
  const android = platform === "android";
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "" : window.location.href;
  const brand = useLinkBrand();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Some in-app browsers block the clipboard. The instruction stands on its
      // own and the URL is shown below, so this stays silent rather than
      // raising an error about a convenience.
    }
  };

  // Two sets of keys, not one set with the glyph swapped: the menu, its
  // position and the row's label all differ per platform, and a translator
  // needs to see each sentence whole.
  const copyFor = android
    ? {
        title: t("loyalty.androidTitle", "Open this page in your browser"),
        body: t(
          "loyalty.androidBody",
          "Sign-up doesn't work inside {{app}}. Tap the ⋮ menu at the top of this screen and choose “Open in Chrome” or “Open in browser”, then continue there.",
          { app },
        ),
        step1: t("loyalty.androidStep1", "Tap the ⋮ menu at the top of this screen"),
        step2: t("loyalty.androidStep2", "Choose “Open in Chrome” or “Open in browser”"),
        step2Hint: t(
          "loyalty.androidStep2Hint",
          "Some apps call it “Open in external browser” or “Open with…”.",
        ),
        menuItem: t("loyalty.androidMenuItem", "Open in Chrome"),
      }
    : {
        title: t("loyalty.safariTitle", "Open this page in your browser"),
        body: t(
          "loyalty.safariBody",
          "Cards can't be added from inside {{app}}. Tap the ··· menu at the top of this screen and choose “Open in Safari”, then continue there.",
          { app },
        ),
        step1: t("loyalty.safariStep1", "Tap the ··· menu at the top of this screen"),
        step2: t("loyalty.safariStep2", "Choose “Open in Safari”"),
        step2Hint: t(
          "loyalty.safariStep2Hint",
          "Some apps call it “Open in browser” or “Open in external browser”.",
        ),
        menuItem: t("loyalty.safariMenuItem", "Open in Safari"),
      };

  const steps: { title: string; hint?: string }[] = [
    { title: copyFor.step1 },
    { title: copyFor.step2, hint: copyFor.step2Hint },
  ];

  return (
    <StorefrontShell brand={brand} product="loyalty">
      <div className="flex flex-col gap-8 pb-2 pt-3">
        <header className="flex flex-col gap-2.5">
          <h1 className="font-serif text-[32px] leading-[1.1] text-balance">
            {copyFor.title}
          </h1>
          <p className="max-w-[38ch] text-[15px] leading-relaxed text-muted-foreground">
            {copyFor.body}
          </p>
        </header>

        <Panel className="flex flex-col gap-5">
          <GestureDemo app={app} label={copyFor.menuItem} platform={platform} />

          {/* The same two taps as text — what a screen reader gets, and what
              stays once the eye has followed the demonstration. Numbers in the
              mono cut like every other figure on these pages. */}
          <ol className="flex flex-col gap-3 border-t border-border/60 pt-5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-primary font-mono text-[12px] font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-balance">
                    {step.title}
                  </h2>
                  {step.hint ? (
                    <p className="text-[13px] leading-snug text-muted-foreground">{step.hint}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={copy}
            className="w-full rounded-full"
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            <span aria-live="polite">
              {copied ? t("loyalty.linkCopied", "Link copied") : t("loyalty.copyLink", "Copy link")}
            </span>
          </Button>

          {/* Shown as text too: a customer who cannot copy can still read it
              out or type it, and seeing the address makes the instruction
              concrete. An address is LTR in either language. */}
          <p
            dir="ltr"
            className="break-all text-center font-mono text-[12px] leading-relaxed text-muted-foreground"
          >
            {url}
          </p>
        </div>
      </div>
    </StorefrontShell>
  );
}

