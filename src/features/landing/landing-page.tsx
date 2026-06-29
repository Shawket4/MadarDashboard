import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  Calculator,
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
import { env } from "@/data/config/env";
import { cn } from "@/lib/utils";
import {
  BrowserFrame,
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
 * bilingual dashboard, the SwiftUI POS (iPad), and the public ordering journey
 * (menu → customise → cart → track), captured EN + AR.
 * ────────────────────────────────────────────────────────────────────────── */

const dashShot = (name: string, lang: string) =>
  `/screenshots/dash-${name}-${lang === "ar" ? "ar" : "en"}.png`;

// Hero load choreography — the eyebrow, headline, subhead and CTAs ease up in turn.
const HERO_EASE = [0.22, 1, 0.36, 1] as const;
const heroContainer = { hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.06 } } };
const heroItem = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.9, ease: HERO_EASE } },
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
  useLenis();

  const loginUrl = `${env.VITE_DASHBOARD_URL}/login`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header loginUrl={loginUrl} />
      <main>
        <Hero lang={lang} reduced={reduced} />
        <StatStrip />
        <DashboardShowcase lang={lang} />
        <BilingualSection />
        <PosShowcase />
        <CustomerJourney lang={lang} />
        <Pillars />
        <CtaBand loginUrl={loginUrl} />
      </main>
      <Footer />
    </div>
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
        <img src="/madar.svg" alt={t("app.name", "Madar")} className="h-7 dark:invert" />
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

function Hero({ lang, reduced }: { lang: string; reduced: boolean | null }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const frameY = useTransform(scrollYProgress, [0, 1], ["0px", "-64px"]);
  const container = reduced ? {} : { variants: heroContainer, initial: "hidden" as const, animate: "show" as const };
  const item = reduced ? {} : { variants: heroItem };

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[40rem] max-w-5xl rounded-[50%] bg-gradient-to-br from-brand/20 via-primary/10 to-transparent blur-3xl"
      />
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
            <Button asChild size="lg" variant="brand" className="shadow-sm">
              <a href="#dashboard">
                {t("landing.hero.ctaSecondary", "See it in action")}
                <ArrowRight className="size-4 rotate-90" />
              </a>
            </Button>
            <ContactDialog>
              <Button size="lg" variant="outline">{t("landing.hero.ctaContact", "Talk to us")}</Button>
            </ContactDialog>
          </motion.div>
        </motion.div>

        {/* Hero visual — the live dashboard, with a touch of scroll parallax. */}
        <motion.div
          style={reduced ? undefined : { y: frameY }}
          {...(reduced
            ? {}
            : ({ initial: { opacity: 0, y: 36 }, animate: { opacity: 1, y: 0 } } as const))}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          className="mx-auto mt-16 max-w-5xl"
        >
          <BrowserFrame>
            <Screenshot
              src={dashShot("overview", lang)}
              alt={t("landing.hero.caption", "The Madar dashboard")}
              label={t("landing.hero.caption", "The Madar dashboard")}
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

function DashboardShowcase({ lang }: { lang: string }) {
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

        <Reveal className="mx-auto mt-14 max-w-5xl" variant="scale">
          <BrowserFrame url="madar-pos.cloud/orders">
            <Screenshot
              src={dashShot("orders", lang)}
              alt={t("landing.dashboard.orders.title", "Order history")}
              label={t("landing.dashboard.orders.title", "Order history")}
            />
          </BrowserFrame>
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-2">
          <Reveal variant="left">
            <BrowserFrame url="madar-pos.cloud/analytics">
              <Screenshot
                src={dashShot("analytics", lang)}
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
          <Reveal variant="right">
            <BrowserFrame url="madar-pos.cloud/menu/recipes">
              <Screenshot
                src="/screenshots/dash-recipes.png"
                alt={t("landing.dashboard.recipes.title", "Recipe costing")}
                label={t("landing.dashboard.recipes.title", "Recipe costing")}
              />
            </BrowserFrame>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              <span className="font-medium text-foreground">
                {t("landing.dashboard.recipes.title", "Menu & recipe costing")}.
              </span>{" "}
              {t(
                "landing.dashboard.recipes.desc",
                "Build recipes and add-ons per size and know the true cost — and margin — of everything you sell.",
              )}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ── Bilingual section (the signature moment) ───────────────────────────────── */

function BilingualSection() {
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
                src="/screenshots/dash-overview-en.png"
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
                src="/screenshots/dash-overview-ar.png"
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

function PosShowcase() {
  const { t } = useTranslation();
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
            "A fast SwiftUI app for the counter — browse the menu, build a cart, split a bill, take cash with live change, fire to the kitchen, and close the drawer with a Z-report. Offline-first, so the line never stops.",
          )}
        />

        <div className="mx-auto mt-14 grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal variant="scale">
            <IpadFrame>
              <Screenshot
                src="/screenshots/pos-order.png"
                alt={t("landing.pos.shots.order.title", "Order screen")}
                label={t("landing.pos.shots.order.title", "Order screen")}
                className="object-contain"
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
            <RevealItem key={s.key}>
              <IpadFrame>
                <Screenshot
                  src={`/screenshots/${s.file}.png`}
                  alt={t(`landing.pos.shots.${s.key}.title`, s.key)}
                  label={t(`landing.pos.shots.${s.key}.title`, s.key)}
                  className="object-contain"
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

function CustomerJourney({ lang }: { lang: string }) {
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
        <RevealGroup className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4 sm:gap-x-5">
          {steps.map((s, i) => (
            <RevealItem
              key={s.key}
              className={cn("flex flex-col items-center", i % 2 === 1 && "sm:translate-y-10")}
            >
              <PhoneFrame className="w-full max-w-[200px]">
                <Screenshot
                  src={`/screenshots/${s.file}-${lang}.png`}
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
            </RevealItem>
          ))}
        </RevealGroup>
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
            <RevealItem key={key}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
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
                  <Button size="lg" variant="brand" className="shadow-sm">
                    {t("landing.cta.contact", "Contact us")} <ArrowRight className="size-4 rtl:rotate-180" />
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
        <img src="/madar.svg" alt={t("app.name", "Madar")} className="h-6 opacity-80 dark:invert" />
        <SocialLinks />
        <p className="text-sm text-muted-foreground">
          {t("common.copyright", { year, defaultValue: `© ${year} Madar` })}
        </p>
      </div>
    </footer>
  );
}
