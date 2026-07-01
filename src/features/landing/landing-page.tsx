import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  Building2,
  Calculator,
  ChevronDown,
  Clock,
  Languages,
  Receipt,
  ShieldCheck,
  Truck,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useTheme } from "@/lib/theme";
import { env } from "@/data/config/env";
import { cn } from "@/lib/utils";
import {
  BrowserFrame,
  GpuStaggerReveal,
  IpadFrame,
  PhoneFrame,
  Reveal,
  RevealGroup,
  RevealItem,
  Screenshot,
} from "./frames";
import { ContactDialog, SocialLinks } from "./contact";
import { useLenis } from "./use-lenis";

/* ─────────────────────────────────────────────────────────────────────────────
 * Madar — marketing landing page (register: BRAND).
 *
 * Standalone on get.madar-pos.cloud. Editorial, hospitable, bilingual-by-symmetry,
 * with varied scroll-reveals and smooth-scroll flow. Real product shots: the
 * bilingual dashboard, the native POS (iPad, Android, Mac, Windows, Linux), and the public ordering journey
 * (menu → customise → cart → track), captured EN + AR.
 * ────────────────────────────────────────────────────────────────────────── */

// Screenshots ship a light and a dark variant (`-dark` suffix). We only ever
// reference the one matching the active theme, so the other set is NEVER loaded.
const dashShot = (name: string, lang: string, dark: boolean) =>
  `/screenshots/dash-${name}-${lang === "ar" ? "ar" : "en"}${dark ? "-dark" : ""}.webp`;

/** Every showcase shot has 4 variants (en/ar × light/dark); the page references only
 *  the active one, so the rest are never loaded. Below-the-fold shots are warmed into
 *  cache after first paint (hero loads eagerly on its own). */
const DASH_SHOTS = ["orders", "analytics", "engineering", "branches", "ingredients", "variance", "lowstock", "recipes"];
const preloadShots = (lang: string, dark: boolean): string[] => {
  const d = dark ? "-dark" : "";
  return [
    ...DASH_SHOTS.map((n) => dashShot(n, lang, dark)),
    // The bilingual section always shows both EN and AR overviews.
    `/screenshots/dash-overview-en${d}.webp`,
    `/screenshots/dash-overview-ar${d}.webp`,
    ...["order-menu", "order-customize", "order-cart", "order-track"].map((f) => `/screenshots/${f}-${lang}${d}.webp`),
  ];
};

/** Warm the browser cache for the given image URLs during idle time after mount. */
function usePreloadImages(urls: string[]) {
  const key = urls.join("|");
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      for (const url of urls) {
        const img = new Image();
        img.src = url;
        // Decode to a bitmap now (during idle) so the reveal scroll doesn't pay the
        // decode cost on the same frame it animates.
        img.decode?.().catch(() => {});
      }
    };
    const ric = (window as unknown as { requestIdleCallback?: typeof window.requestIdleCallback })
      .requestIdleCallback;
    if (ric) {
      const id = ric(warm, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(warm, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// Hero load choreography — the eyebrow, headline, subhead and CTAs spring up in
// turn. Transform + opacity only (60fps); a touch of overshoot for life.
const heroContainer = { hidden: {}, show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } } };
const heroItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 19, mass: 0.85 } },
};

interface Pillar {
  key: string;
  icon: LucideIcon;
  accent: string;
}

const PILLARS: Pillar[] = [
  { key: "pos", icon: Receipt, accent: "text-brand bg-brand/10" },
  { key: "costing", icon: Calculator, accent: "text-primary bg-primary/10" },
  { key: "inventory", icon: Boxes, accent: "text-info bg-info/10" },
  { key: "shifts", icon: Clock, accent: "text-success bg-success/10" },
  { key: "delivery", icon: Truck, accent: "text-warning bg-warning/10" },
  { key: "analytics", icon: BarChart3, accent: "text-brand bg-brand/10" },
  { key: "multibranch", icon: Building2, accent: "text-primary bg-primary/10" },
  { key: "permissions", icon: ShieldCheck, accent: "text-info bg-info/10" },
];

export function LandingPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const reduced = useReducedMotion();
  const dark = useTheme((s) => s.resolvedTheme) === "dark";
  useLenis();
  usePreloadImages(preloadShots(lang, dark));

  const loginUrl = `${env.VITE_DASHBOARD_URL}/login`;

  return (
    // overflow-x-clip: the slide-in reveals start translated off-screen; clip the
    // horizontal overflow so the page never scrolls sideways (clip keeps the sticky
    // header + vertical scroll working, unlike overflow-hidden).
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <ScrollProgress reduced={reduced} />
      <Header loginUrl={loginUrl} />
      <main>
        <Hero lang={lang} dark={dark} reduced={reduced} />
        <StatStrip />
        <DashboardShowcase lang={lang} dark={dark} />
        <CostSpine lang={lang} dark={dark} />
        <InventorySection lang={lang} dark={dark} />
        <BilingualSection dark={dark} />
        <PosShowcase lang={lang} dark={dark} />
        <CustomerJourney lang={lang} dark={dark} />
        <Pillars />
        <FaqSection />
        <CtaBand loginUrl={loginUrl} />
      </main>
      <Footer />
    </div>
  );
}

/** A slim reading-progress bar pinned to the very top — orients the reader on a
 *  long page. Driven by scroll position (a spring smooths the scaleX), so it sits
 *  out under reduced-motion. */
function ScrollProgress({ reduced }: { reduced: boolean | null }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });
  if (reduced) return null;
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-40 h-0.5 origin-left bg-brand rtl:origin-right"
    />
  );
}

/** The Madar wordmark — Arabic logotype in AR, and pure-white (not accent-tinted)
 *  in dark mode, matching the dashboard.
 *
 *  Both logotypes are rendered and toggled with CSS (`hidden`), so switching
 *  language is an instant class flip — no `src` swap, no network fetch, no
 *  width-collapse jitter. They're also preloaded in get.html, so both are cached
 *  from first paint. */
function Wordmark({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const ar = i18n.language === "ar";
  const base = cn("dark:brightness-0 dark:invert", className);
  return (
    <>
      <img src="/madar.svg" alt={t("app.name", "Madar")} className={cn(base, ar && "hidden")} />
      <img src="/madar_ar.svg" alt={t("app.name", "Madar")} className={cn(base, !ar && "hidden")} />
    </>
  );
}

/** One-tap EN ⇄ AR toggle (no admin store — this origin holds no session). */
function LangToggle() {
  const { t, i18n } = useTranslation();
  const next = i18n.language === "ar" ? "en" : "ar";
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => void i18n.changeLanguage(next)}
      aria-label={t("language.switch", "Switch language")}
      className="font-semibold"
    >
      <span className="text-xs">{next === "ar" ? "ع" : "EN"}</span>
    </Button>
  );
}

/* ── Header ─────────────────────────────────────────────────────────────────── */

function Header({ loginUrl }: { loginUrl: string }) {
  const { t } = useTranslation();
  const navLink =
    "rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Wordmark className="h-7" />
        <nav className="ms-9 hidden items-center gap-8 md:flex">
          <a className={navLink} href="#dashboard">{t("landing.nav.dashboard", "Dashboard")}</a>
          <a className={navLink} href="#pos">{t("landing.nav.pos", "Point of sale")}</a>
          <a className={navLink} href="#features">{t("landing.nav.features", "Features")}</a>
          <ContactDialog>
            <button type="button" className={navLink}>{t("landing.nav.contact", "Contact")}</button>
          </ContactDialog>
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <LangToggle />
          <ThemeToggle />
          <Button asChild size="sm" className="ms-1.5">
            <a href={loginUrl}>{t("auth.signIn", "Sign in")}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────────── */

function Hero({ lang, dark, reduced }: { lang: string; dark: boolean; reduced: boolean | null }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const frameY = useTransform(scrollYProgress, [0, 1], ["0px", "-64px"]);
  const container = reduced ? {} : { variants: heroContainer, initial: "hidden" as const, animate: "show" as const };
  const item = reduced ? {} : { variants: heroItem };

  return (
    <section ref={ref} className="relative overflow-hidden">
      {/* Ambient glow behind the hero — breathes slowly to keep the signature
          moment alive (scale + opacity only; cached blur layer, so it stays smooth). */}
      {reduced ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[40rem] max-w-5xl rounded-[50%] bg-gradient-to-br from-brand/20 via-primary/10 to-transparent blur-3xl"
        />
      ) : (
        <motion.div
          aria-hidden
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.06, 1] }}
          transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[40rem] max-w-5xl rounded-[50%] bg-gradient-to-br from-brand/20 via-primary/10 to-transparent blur-3xl"
        />
      )}
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8 lg:pt-24">
        <motion.div {...container} className="mx-auto max-w-3xl">
          <motion.span {...item} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="size-1.5 rounded-full bg-brand" />
            {t("landing.hero.eyebrow", "Coffee-shop operations, end to end")}
          </motion.span>
          <motion.h1 {...item} className="mt-6 font-serif text-[2.6rem] leading-[1.04] tracking-tight text-balance sm:text-6xl">
            {t("landing.hero.title", "Run the whole shop from one warm ledger.")}
          </motion.h1>
          <motion.p {...item} className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-foreground/80 text-pretty">
            {t(
              "landing.hero.subtitle",
              "Point of sale, recipe costing, inventory, shifts, delivery and analytics — one bilingual platform that ties what you sell to what it costs. Online or off, in Arabic or English.",
            )}
          </motion.p>
          <motion.div {...item} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              variant="brand"
              className="group shadow-sm transition-transform active:scale-[0.97]"
            >
              <a href="https://demo.madar-pos.cloud" target="_blank" rel="noopener noreferrer">
                {t("landing.hero.ctaDemo", "Try the live demo")}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group transition-transform active:scale-[0.97]"
            >
              <a href="#dashboard">
                {t("landing.hero.ctaSecondary", "See it in action")}
                <ArrowRight className="size-4 rotate-90 transition-transform duration-300 group-hover:translate-y-0.5" />
              </a>
            </Button>
            <ContactDialog>
              <Button size="lg" variant="outline" className="transition-transform active:scale-[0.97]">
                {t("landing.hero.ctaContact", "Talk to us")}
              </Button>
            </ContactDialog>
          </motion.div>
        </motion.div>

        {/* Hero visual — springs up into place (scale + opacity, so it doesn't
            fight the parallax y), then drifts on scroll. */}
        <motion.div
          style={reduced ? undefined : { y: frameY }}
          {...(reduced
            ? {}
            : ({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } } as const))}
          transition={{ type: "spring" as const, stiffness: 150, damping: 20, mass: 1, delay: 0.18 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <BrowserFrame>
            <Screenshot
              src={dashShot("overview", lang, dark)}
              alt={t("landing.hero.caption", "The Madar dashboard")}
              label={t("landing.hero.caption", "The Madar dashboard")}
              priority
            />
          </BrowserFrame>
        </motion.div>
      </div>
    </section>
  );
}

/* ── Stat strip ─────────────────────────────────────────────────────────────── */

function StatStrip() {
  const { t } = useTranslation();
  const stats = [
    { value: t("landing.stats.branches.value", "Multi-branch"), label: t("landing.stats.branches.label", "Rollups across every location") },
    { value: t("landing.stats.bilingual.value", "EN · ع"), label: t("landing.stats.bilingual.label", "Bilingual, first-class RTL") },
    { value: t("landing.stats.offline.value", "Offline-first"), label: t("landing.stats.offline.label", "Keeps selling when the line drops") },
    { value: t("landing.stats.ledger.value", "Append-only"), label: t("landing.stats.ledger.label", "An honest, auditable ledger") },
  ];
  return (
    <section className="border-y border-border bg-muted/40">
      <RevealGroup
        className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border/70 px-0 sm:px-6 lg:grid-cols-4 lg:px-8 rtl:divide-x-reverse"
        stagger={0.1}
      >
        {stats.map((s) => (
          <RevealItem key={s.value} className="px-5 py-8 text-center sm:py-9">
            <div className="font-serif text-2xl leading-none text-foreground sm:text-[1.75rem]">{s.value}</div>
            <div className="mt-2 text-sm leading-snug text-muted-foreground text-pretty">{s.label}</div>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}

/* ── Section heading helper ─────────────────────────────────────────────────── */

function SectionHead({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  // The three lines ease up in sequence as the head slides into view.
  return (
    <RevealGroup className="mx-auto max-w-2xl text-center" stagger={0.12}>
      <RevealItem>
        <p className="text-sm font-semibold tracking-wide text-brand">{eyebrow}</p>
      </RevealItem>
      <RevealItem>
        <h2 className="mt-3 font-serif text-3xl leading-[1.1] tracking-tight text-balance sm:text-[2.5rem]">
          {title}
        </h2>
      </RevealItem>
      {subtitle ? (
        <RevealItem>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
            {subtitle}
          </p>
        </RevealItem>
      ) : null}
    </RevealGroup>
  );
}

/* ── Dashboard showcase ─────────────────────────────────────────────────────── */

function DashboardShowcase({ lang, dark }: { lang: string; dark: boolean }) {
  const { t } = useTranslation();
  return (
    <section id="dashboard" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t("landing.dashboard.eyebrow", "The back office")}
          title={t("landing.dashboard.title", "Numbers you can act on")}
          subtitle={t(
            "landing.dashboard.subtitle",
            "Every order, shift and adjustment rolls up into one trustworthy view — revenue, payment mix, branch performance, and the true cost behind each cup.",
          )}
        />

        <Reveal className="mx-auto mt-14 max-w-5xl" variant="scale" lift>
          <BrowserFrame url="madar-pos.cloud/orders">
            <Screenshot
              src={dashShot("orders", lang, dark)}
              alt={t("landing.dashboard.orders.title", "Order history")}
              label={t("landing.dashboard.orders.title", "Order history")}
            />
          </BrowserFrame>
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-2">
          <Reveal variant="left" className="min-w-0">
            <BrowserFrame url="madar-pos.cloud/analytics">
              <Screenshot
                src={dashShot("analytics", lang, dark)}
                alt={t("landing.dashboard.analytics.title", "Analytics")}
                label={t("landing.dashboard.analytics.title", "Analytics")}
              />
            </BrowserFrame>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              <span className="font-medium text-foreground">
                {t("landing.dashboard.analytics.title", "Analytics & reports")}.
              </span>{" "}
              {t(
                "landing.dashboard.analytics.desc",
                "Revenue, top items, peak hours, tellers and branch comparison — exportable any time.",
              )}
            </p>
          </Reveal>
          <Reveal variant="right" className="min-w-0">
            <BrowserFrame url="madar-pos.cloud/analytics?tab=branches">
              <Screenshot
                src={dashShot("branches", lang, dark)}
                alt={t("landing.dashboard.branches.title", "Branch comparison")}
                label={t("landing.dashboard.branches.title", "Branch comparison")}
              />
            </BrowserFrame>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              <span className="font-medium text-foreground">
                {t("landing.dashboard.branches.title", "Branch by branch")}.
              </span>{" "}
              {t(
                "landing.dashboard.branches.desc",
                "Rank every location side by side — revenue, orders and void rate — so you know what's working where.",
              )}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Cost-to-margin spine (the differentiator) ──────────────────────────────── */

/** Flagship section: the thread no competitor tells — supplier cost → recipe →
 *  the real margin on every order. Three framed shots in a stepped narrative. */
function CostSpine({ lang, dark }: { lang: string; dark: boolean }) {
  const { t } = useTranslation();
  const steps = [
    {
      key: "ingredients",
      url: "madar-pos.cloud/inventory/items",
      variant: "left" as const,
      title: "Ingredient cost",
      desc: "Every ingredient with its cost per unit, supplier and reorder point — the foundation every cost is built on.",
    },
    {
      key: "recipe",
      url: "madar-pos.cloud/menu/recipes",
      variant: "rise" as const,
      recipe: true,
      title: "Recipe per size",
      desc: "Tie each item to its ingredients and Madar computes the cost and margin for every size you sell.",
    },
    {
      key: "engineering",
      url: "madar-pos.cloud/menu/engineering",
      variant: "right" as const,
      title: "Profit you can see",
      desc: "Roll it up: COGS, gross profit, and exactly which items earn their place on the menu.",
    },
  ];
  return (
    <section id="costing" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t("landing.cost.eyebrow", "Cost to margin")}
          title={t("landing.cost.title", "Know the true cost of every cup")}
          subtitle={t(
            "landing.cost.subtitle",
            "Madar follows every piaster — from the supplier invoice to the recipe to the exact cost of each order. You always know your real margin.",
          )}
        />
        <div className="mx-auto mt-14 grid max-w-5xl items-start gap-8 lg:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.key} variant={s.variant} className="min-w-0">
              <BrowserFrame url={s.url}>
                <Screenshot
                  src={dashShot(s.recipe ? "recipes" : s.key, lang, dark)}
                  alt={t(`landing.cost.steps.${s.key}.title`, s.title)}
                  label={t(`landing.cost.steps.${s.key}.title`, s.title)}
                />
              </BrowserFrame>
              <p className="mt-4 inline-flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground tabular-nums">
                  {i + 1}
                </span>
                <span>
                  <span className="font-medium text-foreground">{t(`landing.cost.steps.${s.key}.title`, s.title)}.</span>{" "}
                  {t(`landing.cost.steps.${s.key}.desc`, s.desc)}
                </span>
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Inventory & stock control ──────────────────────────────────────────────── */

function InventorySection({ lang, dark }: { lang: string; dark: boolean }) {
  const { t } = useTranslation();
  return (
    <section className="border-y border-border bg-muted/40 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t("landing.inventory.eyebrow", "Stock control")}
          title={t("landing.inventory.title", "Catch shrinkage before it eats your margin")}
          subtitle={t(
            "landing.inventory.subtitle",
            "Count stock, log waste and transfer between branches — and let Madar flag what's low and what went missing, with the cost impact in piasters.",
          )}
        />
        <div className="mx-auto mt-14 grid max-w-5xl gap-10 lg:grid-cols-2">
          <Reveal variant="left" className="min-w-0">
            <BrowserFrame url="madar-pos.cloud/inventory/counts">
              <Screenshot
                src={dashShot("variance", lang, dark)}
                alt={t("landing.inventory.variance.title", "Stock counts")}
                label={t("landing.inventory.variance.title", "Stock counts")}
              />
            </BrowserFrame>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              <span className="font-medium text-foreground">
                {t("landing.inventory.variance.title", "Stock counts & variance")}.
              </span>{" "}
              {t(
                "landing.inventory.variance.desc",
                "Count what's on the shelf against what the system expects — every discrepancy flagged, priced and explained.",
              )}
            </p>
          </Reveal>
          <Reveal variant="right" className="min-w-0">
            <BrowserFrame url="madar-pos.cloud/inventory/reports">
              <Screenshot
                src={dashShot("lowstock", lang, dark)}
                alt={t("landing.inventory.reports.title", "Inventory reports")}
                label={t("landing.inventory.reports.title", "Inventory reports")}
              />
            </BrowserFrame>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              <span className="font-medium text-foreground">
                {t("landing.inventory.reports.title", "Low-stock alerts & valuation")}.
              </span>{" "}
              {t(
                "landing.inventory.reports.desc",
                "Know what to reorder before you run out, and the cash value sitting on your shelves at any moment.",
              )}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Bilingual section (the signature moment) ───────────────────────────────── */

function BilingualSection({ dark }: { dark: boolean }) {
  const { t } = useTranslation();
  return (
    <section className="border-y border-border bg-muted/40 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t("landing.bilingual.eyebrow", "Bilingual by symmetry")}
          title={t("landing.bilingual.title", "Arabic is a peer, not a translation")}
          subtitle={t(
            "landing.bilingual.subtitle",
            "Every layout, number and date reads as native in both directions — Arabic numerals, Cairo time, and a layout that flips cleanly for right-to-left. The same screen, equally at home in either language.",
          )}
        />
        <div className="mx-auto mt-14 grid max-w-5xl items-start gap-6 lg:grid-cols-2 lg:gap-8">
          {/* The two panels slide in from the side each language reads from. */}
          <Reveal variant="left">
            <div className="overflow-hidden rounded-xl border border-border shadow-lg" dir="ltr">
              <Screenshot
                src={`/screenshots/dash-overview-en${dark ? "-dark" : ""}.webp`}
                alt="Madar dashboard in English"
                label="Dashboard — English"
                className="aspect-[16/10]"
              />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
              {t("landing.bilingual.en", "English · left-to-right")}
            </p>
          </Reveal>
          <Reveal variant="right">
            <div className="overflow-hidden rounded-xl border border-border shadow-lg" dir="rtl">
              <Screenshot
                src={`/screenshots/dash-overview-ar${dark ? "-dark" : ""}.webp`}
                alt="Madar dashboard in Arabic"
                label="لوحة التحكم — العربية"
                className="aspect-[16/10]"
              />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
              {t("landing.bilingual.ar", "العربية · من اليمين لليسار")}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── POS showcase ───────────────────────────────────────────────────────────── */

function PosShowcase({ lang, dark }: { lang: string; dark: boolean }) {
  const { t } = useTranslation();
  // 4-state like everything else (en/ar × light/dark). Variants you haven't
  // captured yet fall back to the Screenshot placeholder.
  const posShot = (file: string) => `/screenshots/${file}-${lang}${dark ? "-dark" : ""}.webp`;
  const features = [
    { key: "order", icon: Receipt },
    { key: "tender", icon: Calculator },
    { key: "kitchen", icon: Clock },
    { key: "shift", icon: ShieldCheck },
  ];
  const rest = [
    { key: "tender", file: "pos-tender" },
    { key: "kitchen", file: "pos-kitchen" },
    { key: "shift", file: "pos-shift" },
  ];

  return (
    <section id="pos" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t("landing.pos.eyebrow", "The counter")}
          title={t("landing.pos.title", "A native point of sale, built for the rush")}
          subtitle={t(
            "landing.pos.subtitle",
            "A fast native app for the counter — on iPad, Android, Mac, Windows or Linux. Browse the menu, build a cart, split a bill, take cash with live change, fire to the kitchen, and close the drawer with a Z-report. Offline-first, so the line never stops.",
          )}
        />

        <div className="mx-auto mt-14 grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="scale" lift>
            <IpadFrame>
              <Screenshot
                src={posShot("pos-order")}
                fallbackSrc="/screenshots/pos-order-en.webp"
                alt={t("landing.pos.shots.order.title", "Order screen")}
                label={t("landing.pos.shots.order.title", "Order screen")}
              />
            </IpadFrame>
          </Reveal>
          <RevealGroup className="space-y-6">
            {features.map(({ key, icon: Icon }) => (
              <RevealItem key={key}>
                <div className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-5" />
                  </span>
                  <div className="pt-0.5">
                    <h3 className="font-semibold leading-snug">{t(`landing.pos.shots.${key}.title`, key)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                      {t(`landing.pos.shots.${key}.desc`, "")}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <RevealGroup className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-3">
          {rest.map((s) => (
            <RevealItem key={s.key} lift>
              <IpadFrame>
                <Screenshot
                  src={posShot(s.file)}
                  fallbackSrc={`/screenshots/${s.file}-en.webp`}
                  alt={t(`landing.pos.shots.${s.key}.title`, s.key)}
                  label={t(`landing.pos.shots.${s.key}.title`, s.key)}
                />
              </IpadFrame>
              <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
                {t(`landing.pos.shots.${s.key}.title`, s.key)}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ── Customer ordering journey ──────────────────────────────────────────────── */

function CustomerJourney({ lang, dark }: { lang: string; dark: boolean }) {
  const { t } = useTranslation();
  const steps = [
    { key: "menu", file: "order-menu" },
    { key: "customize", file: "order-customize" },
    { key: "cart", file: "order-cart" },
    { key: "track", file: "order-track" },
  ];
  return (
    <section className="border-y border-border bg-muted/40 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t("landing.customer.eyebrow", "For your customers")}
          title={t("landing.customer.title", "Order in a few taps — no app to install")}
          subtitle={t(
            "landing.customer.subtitle",
            "Scan a QR and your customers get a beautiful bilingual menu: browse, customise each drink, build a cart, and track the order live — on any phone.",
          )}
        />
        {/* Heavy, image-dense group → GPU-accelerated reveal (compositor WAAPI spring)
            so it stays smooth against Lenis's scroll loop. The entrance transform is
            owned by the [data-reveal] element; the staggered offset + hover lift live
            on inner wrappers so nothing fights for the same transform. */}
        <GpuStaggerReveal className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4 sm:gap-x-5">
          {steps.map((s, i) => (
            <div key={s.key} data-reveal className="flex flex-col items-center">
              <div className={cn("flex w-full flex-col items-center", i % 2 === 1 && "sm:translate-y-12")}>
                <PhoneFrame className="w-full max-w-[200px] transition-transform duration-300 ease-out hover:-translate-y-2 hover:scale-[1.02]">
                  <Screenshot
                    src={`/screenshots/${s.file}-${lang}${dark ? "-dark" : ""}.webp`}
                    alt={t(`landing.customer.steps.${s.key}`, s.key)}
                    label={t(`landing.customer.steps.${s.key}`, s.key)}
                  />
                </PhoneFrame>
                <p className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="grid size-5 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground tabular-nums">
                    {i + 1}
                  </span>
                  {t(`landing.customer.steps.${s.key}`, s.key)}
                </p>
              </div>
            </div>
          ))}
        </GpuStaggerReveal>
      </div>
    </section>
  );
}

/* ── Feature pillars ────────────────────────────────────────────────────────── */

function Pillars() {
  const { t } = useTranslation();
  return (
    <section id="features" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t("landing.features.eyebrow", "One platform")}
          title={t("landing.features.title", "Everything your counter needs")}
          subtitle={t(
            "landing.features.subtitle",
            "Purpose-built for cafés and quick-service in Egypt — precise with money, honest with the ledger, and fast where it matters.",
          )}
        />
        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ key, icon: Icon, accent }) => (
            <RevealItem key={key} lift>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg">
                <span className={cn("grid size-11 place-items-center rounded-xl", accent)}>
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 font-semibold">{t(`landing.features.items.${key}.title`, key)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(`landing.features.items.${key}.desc`, "")}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-10" variant="fade">
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <WifiOff className="size-4 text-brand" /> {t("landing.features.tags.offline", "Offline-first")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Languages className="size-4 text-brand" /> {t("landing.features.tags.bilingual", "Arabic & English")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand" /> {t("landing.features.tags.permissions", "Role-based access")}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────────────────────── */

/* Answer-shaped Q&A — clear, factual, extractable. The same questions/answers are
 * emitted as FAQPage JSON-LD in get.html so search + AI Overviews can cite them. */
const FAQ_ITEMS = [
  {
    key: "what",
    q: "What is Madar?",
    a: "Madar is a bilingual (English/Arabic) platform to run a coffee shop end to end — point of sale, recipe costing, inventory, shifts, delivery and analytics — built for cafés and quick-service in Egypt.",
  },
  {
    key: "costing",
    q: "How does recipe costing work?",
    a: "You build a recipe for each item and size from your ingredients, and Madar shows the true cost — and margin — of everything you sell. That cost flows into every order, so you always know your real food cost.",
  },
  {
    key: "offline",
    q: "Does Madar work offline?",
    a: "Yes. The point-of-sale app is offline-first — it keeps taking orders when the internet drops and syncs everything automatically the moment the connection returns, so nothing is lost.",
  },
  {
    key: "arabic",
    q: "Does Madar support Arabic?",
    a: "Yes. Madar is fully bilingual with first-class right-to-left support: every screen, number and date reads natively in both Arabic and English, and staff can switch language at any time.",
  },
  {
    key: "qr",
    q: "Can customers order with a QR code?",
    a: "Yes. Customers scan a QR code at the table or branch and get a bilingual menu to browse, customise each drink, build a cart and track their order live — with no app to install.",
  },
  {
    key: "delivery",
    q: "Does Madar handle delivery and the kitchen?",
    a: "Yes. Madar supports delivery with distance-based zones and fees, in-mall and outside channels, live order tracking, and a kitchen display that fires tickets to the line and tracks them by how long they've waited.",
  },
  {
    key: "branches",
    q: "Does Madar support multiple branches?",
    a: "Yes. Madar is multi-branch: every order, shift and report rolls up across all your locations, with side-by-side branch comparison and per-branch menu and price overrides.",
  },
  {
    key: "devices",
    q: "What devices does it run on?",
    a: "The point of sale is a fast native app that runs on iPad, Android, Mac, Windows and Linux — every platform sharing one core, so it behaves identically everywhere. The management dashboard runs in any web browser (and as a desktop app). Customers order from any phone — no install needed.",
  },
] as const;

function FaqSection() {
  const { t } = useTranslation();
  return (
    <section id="faq" className="scroll-mt-24 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHead
          eyebrow={t("landing.faq.eyebrow", "Good to know")}
          title={t("landing.faq.title", "Frequently asked")}
          subtitle={t("landing.faq.subtitle", "What café owners tend to ask before switching.")}
        />
        <RevealGroup className="mt-12 space-y-3" stagger={0.06}>
          {FAQ_ITEMS.map((item) => (
            <RevealItem key={item.key}>
              <details className="group rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-shadow open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-foreground marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="text-pretty">{t(`landing.faq.items.${item.key}.q`, item.q)}</span>
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {t(`landing.faq.items.${item.key}.a`, item.a)}
                </p>
              </details>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ── CTA band ───────────────────────────────────────────────────────────────── */

function CtaBand({ loginUrl }: { loginUrl: string }) {
  const { t } = useTranslation();
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <Reveal variant="scale" className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl brand-panel px-6 py-20 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-24 -top-28 -z-0 h-80 bg-gradient-to-br from-brand/30 to-transparent blur-3xl"
          />
          <RevealGroup className="relative" stagger={0.12}>
            <RevealItem>
              <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-[1.1] tracking-tight text-balance text-white sm:text-[2.5rem]">
                {t("landing.cta.title", "Ready to run your shop on Madar?")}
              </h2>
            </RevealItem>
            <RevealItem>
              <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-white/70">
                {t(
                  "landing.cta.subtitle",
                  "Bring point of sale, costing, inventory and analytics into one bilingual system. Talk to us and we'll set you up.",
                )}
              </p>
            </RevealItem>
            <RevealItem>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <ContactDialog>
                  <Button
                    size="lg"
                    variant="brand"
                    className="group shadow-sm transition-transform active:scale-[0.97]"
                  >
                    {t("landing.cta.contact", "Contact us")}{" "}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </Button>
                </ContactDialog>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-white/25 dark:bg-transparent"
                >
                  <a href={loginUrl}>{t("auth.signIn", "Sign in")}</a>
                </Button>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>
      </Reveal>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-4 sm:flex-row sm:px-6 lg:px-8">
        <Wordmark className="h-6 opacity-80" />
        <SocialLinks />
        <p className="text-sm text-muted-foreground">
          {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
        </p>
      </div>
    </footer>
  );
}
