import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
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

/* ─────────────────────────────────────────────────────────────────────────────
 * Madar — marketing landing page (register: BRAND).
 *
 * Rebuilt from scratch against the current system: the SwiftUI POS, the bilingual
 * management dashboard, and the customer ordering/tracking surfaces. The dashboard
 * shots are real (captured from the MSW mock harness, EN + AR); the POS and
 * customer shots fall back to labeled placeholders until their assets land in
 * /public/screenshots. Editorial, hospitable, bilingual-by-symmetry.
 * ────────────────────────────────────────────────────────────────────────── */

/** Resolve a language-aware dashboard screenshot path. */
const dashShot = (name: string, lang: string) =>
  `/screenshots/dash-${name}-${lang === "ar" ? "ar" : "en"}.png`;

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
  const { t, i18n } = useTranslation();
  const lang = i18n.language === "ar" ? "ar" : "en";
  const reduced = useReducedMotion();

  // This page ships on its own origin (get.madar-pos.cloud) with no session, so
  // CTAs link cross-origin to the dashboard rather than to in-app routes.
  const loginUrl = `${env.VITE_DASHBOARD_URL}/login`;
  const startLabel = t("landing.hero.ctaPrimary", "Get started");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header loginUrl={loginUrl} />
      <main>
        <Hero lang={lang} reduced={reduced} loginUrl={loginUrl} startLabel={startLabel} />
        <StatStrip />
        <DashboardShowcase lang={lang} />
        <BilingualSection lang={lang} />
        <PosShowcase />
        <Pillars />
        <CustomerSurfaces lang={lang} />
        <CtaBand loginUrl={loginUrl} startLabel={startLabel} />
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
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <img src="/madar.svg" alt={t("app.name", "Madar")} className="h-7 dark:invert" />
        <nav className="ms-8 hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a className="transition-colors hover:text-foreground" href="#dashboard">
            {t("landing.nav.dashboard", "Dashboard")}
          </a>
          <a className="transition-colors hover:text-foreground" href="#pos">
            {t("landing.nav.pos", "Point of sale")}
          </a>
          <a className="transition-colors hover:text-foreground" href="#features">
            {t("landing.nav.features", "Features")}
          </a>
        </nav>
        <div className="ms-auto flex items-center gap-1">
          <LangToggle />
          <ThemeToggle />
          <Button asChild size="sm" className="ms-1">
            <a href={loginUrl}>{t("auth.signIn", "Sign in")}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────────── */

function Hero({
  lang,
  reduced,
  loginUrl,
  startLabel,
}: {
  lang: string;
  reduced: boolean | null;
  loginUrl: string;
  startLabel: string;
}) {
  const { t } = useTranslation();
  const enter = reduced
    ? {}
    : ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } } as const);

  return (
    <section className="relative overflow-hidden">
      {/* Brand glow — blurred terracotta→navy wash behind the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 -z-10 mx-auto h-[36rem] max-w-5xl rounded-[50%] bg-gradient-to-br from-brand/20 via-primary/10 to-transparent blur-3xl"
      />
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:px-6 lg:pt-24">
        <motion.div
          {...enter}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="size-1.5 rounded-full bg-brand" />
            {t("landing.hero.eyebrow", "Coffee-shop operations, end to end")}
          </span>
          <h1 className="mt-6 font-serif text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {t("landing.hero.title", "Run the whole shop from one warm ledger.")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/80 text-pretty">
            {t(
              "landing.hero.subtitle",
              "Point of sale, recipe costing, inventory, shifts, delivery and analytics — one bilingual platform that ties what you sell to what it costs. Online or off, in Arabic or English.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="brand" className="shadow-sm">
              <a href={loginUrl}>
                {startLabel} <ArrowRight className="size-4 rtl:rotate-180" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#dashboard">{t("landing.hero.ctaSecondary", "See it in action")}</a>
            </Button>
          </div>
        </motion.div>

        {/* Hero visual — the live dashboard in a browser frame. */}
        <motion.div
          {...(reduced
            ? {}
            : ({
                initial: { opacity: 0, y: 32 },
                animate: { opacity: 1, y: 0 },
              } as const))}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
          className="mx-auto mt-14 max-w-5xl"
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
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.value} className="px-2 py-7 text-center sm:py-8">
            <div className="font-serif text-2xl text-foreground sm:text-3xl">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground text-pretty">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Section heading helper ─────────────────────────────────────────────────── */

function SectionHead({
  eyebrow,
  title,
  subtitle,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="text-sm font-semibold tracking-wide text-brand">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-base text-muted-foreground text-pretty">{subtitle}</p>
      ) : null}
    </div>
  );
}

/* ── Dashboard showcase ─────────────────────────────────────────────────────── */

function DashboardShowcase({ lang }: { lang: string }) {
  const { t } = useTranslation();
  return (
    <section id="dashboard" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHead
            eyebrow={t("landing.dashboard.eyebrow", "The back office")}
            title={t("landing.dashboard.title", "Numbers you can act on")}
            subtitle={t(
              "landing.dashboard.subtitle",
              "Every order, shift and adjustment rolls up into one trustworthy view — revenue, payment mix, branch performance, and the true cost behind each cup.",
            )}
          />
        </Reveal>

        <Reveal className="mt-12" delay={0.05}>
          <BrowserFrame url="madar-pos.cloud/orders">
            <Screenshot
              src={dashShot("orders", lang)}
              alt={t("landing.dashboard.orders.title", "Order history")}
              label={t("landing.dashboard.orders.title", "Order history")}
            />
          </BrowserFrame>
        </Reveal>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <BrowserFrame url="madar-pos.cloud/analytics">
              <Screenshot
                src={dashShot("analytics", lang)}
                alt={t("landing.dashboard.analytics.title", "Analytics")}
                label={t("landing.dashboard.analytics.title", "Analytics")}
              />
            </BrowserFrame>
            <p className="mt-4 text-sm text-muted-foreground text-pretty">
              <span className="font-medium text-foreground">
                {t("landing.dashboard.analytics.title", "Analytics & reports")}.
              </span>{" "}
              {t(
                "landing.dashboard.analytics.desc",
                "Revenue, top items, peak hours, tellers and branch comparison — exportable any time.",
              )}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <BrowserFrame url="madar-pos.cloud/menu/recipes">
              <Screenshot
                src="/screenshots/dash-recipes.png"
                alt={t("landing.dashboard.recipes.title", "Recipe costing")}
                label={t("landing.dashboard.recipes.title", "Recipe costing")}
              />
            </BrowserFrame>
            <p className="mt-4 text-sm text-muted-foreground text-pretty">
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

function BilingualSection({ lang }: { lang: string }) {
  const { t } = useTranslation();
  // Always show both directions side by side, regardless of the active language.
  return (
    <section className="border-y border-border bg-muted/40 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHead
            eyebrow={t("landing.bilingual.eyebrow", "Bilingual by symmetry")}
            title={t("landing.bilingual.title", "Arabic is a peer, not a translation")}
            subtitle={t(
              "landing.bilingual.subtitle",
              "Every layout, number and date reads as native in both directions — Arabic numerals, Cairo time, and a layout that flips cleanly for right-to-left. The same screen, equally at home in either language.",
            )}
          />
        </Reveal>
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-2">
          <Reveal delay={0.05}>
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
          <Reveal delay={0.1}>
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
        <p className="sr-only">{lang}</p>
      </div>
    </section>
  );
}

/* ── POS showcase ───────────────────────────────────────────────────────────── */

function PosShowcase() {
  const { t } = useTranslation();
  const shots = [
    { key: "order", file: "pos-order", hero: true },
    { key: "tender", file: "pos-tender", hero: false },
    { key: "kitchen", file: "pos-kitchen", hero: false },
    { key: "shift", file: "pos-shift", hero: false },
  ];
  const hero = shots.find((s) => s.hero)!;
  const rest = shots.filter((s) => !s.hero);

  return (
    <section id="pos" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHead
            eyebrow={t("landing.pos.eyebrow", "The counter")}
            title={t("landing.pos.title", "A native point of sale, built for the rush")}
            subtitle={t(
              "landing.pos.subtitle",
              "A fast SwiftUI app for the counter — browse the menu, build a cart, split a bill, take cash with live change, fire to the kitchen, and close the drawer with a Z-report. Offline-first, so the line never stops.",
            )}
          />
        </Reveal>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <IpadFrame>
              <Screenshot
                src={`/screenshots/${hero.file}.png`}
                alt={t(`landing.pos.shots.${hero.key}.title`, "Order screen")}
                label={t(`landing.pos.shots.${hero.key}.title`, "Order screen")}
                className="object-contain"
              />
            </IpadFrame>
          </Reveal>
          <RevealGroup className="space-y-5">
            {[
              { key: "order", icon: Receipt },
              { key: "tender", icon: Calculator },
              { key: "kitchen", icon: Clock },
              { key: "shift", icon: ShieldCheck },
            ].map(({ key, icon: Icon }) => (
              <RevealItem key={key}>
                <div className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">
                      {t(`landing.pos.shots.${key}.title`, key)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground text-pretty">
                      {t(`landing.pos.shots.${key}.desc`, "")}
                    </p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        {/* Supporting POS shots */}
        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-3">
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

/* ── Feature pillars ────────────────────────────────────────────────────────── */

function Pillars() {
  const { t } = useTranslation();
  return (
    <section id="features" className="scroll-mt-20 border-t border-border bg-muted/40 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHead
            eyebrow={t("landing.features.eyebrow", "One platform")}
            title={t("landing.features.title", "Everything your counter needs")}
            subtitle={t(
              "landing.features.subtitle",
              "Purpose-built for cafés and quick-service in Egypt — precise with money, honest with the ledger, and fast where it matters.",
            )}
          />
        </Reveal>
        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ key, icon: Icon, accent }) => (
            <RevealItem key={key}>
              <div className="h-full rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <span className={cn("grid size-11 place-items-center rounded-xl", accent)}>
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{t(`landing.features.items.${key}.title`, key)}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                  {t(`landing.features.items.${key}.desc`, "")}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-8" delay={0.1}>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
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

/* ── Customer surfaces ──────────────────────────────────────────────────────── */

function CustomerSurfaces({ lang }: { lang: string }) {
  const { t } = useTranslation();
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold tracking-wide text-brand">
            {t("landing.customer.eyebrow", "For your customers")}
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-balance sm:text-4xl">
            {t("landing.customer.title", "A menu worth sharing — and an order they can track")}
          </h2>
          <p className="mt-4 text-base text-muted-foreground text-pretty">
            {t(
              "landing.customer.subtitle",
              "Give every branch a beautiful public menu and a live order tracker, on any phone, in Arabic or English — no app to install.",
            )}
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {["browse", "order", "track"].map((k) => (
              <li key={k} className="flex items-start gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                  <ArrowRight className="size-3 rtl:rotate-180" />
                </span>
                <span className="text-muted-foreground text-pretty">
                  {t(`landing.customer.points.${k}`, "")}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="flex items-end justify-center gap-5">
            <PhoneFrame className="w-44 sm:w-52">
              <Screenshot
                src={`/screenshots/order-menu-${lang}.png`}
                alt={t("landing.customer.menuAlt", "Public menu")}
                label={t("landing.customer.menuLabel", "Menu")}
              />
            </PhoneFrame>
            <PhoneFrame className="mb-8 w-44 sm:w-52">
              <Screenshot
                src={`/screenshots/order-track-${lang}.png`}
                alt={t("landing.customer.trackAlt", "Order tracking")}
                label={t("landing.customer.trackLabel", "Track")}
              />
            </PhoneFrame>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── CTA band ───────────────────────────────────────────────────────────────── */

function CtaBand({ loginUrl, startLabel }: { loginUrl: string; startLabel: string }) {
  const { t } = useTranslation();
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl brand-panel px-6 py-16 text-center sm:py-20">
        {/* Terracotta glow lives only in the blur (dark-mode-inversion-safe). */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-20 -top-24 -z-0 h-72 bg-gradient-to-br from-brand/30 to-transparent blur-3xl"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-tight tracking-tight text-balance text-white sm:text-4xl">
            {t("landing.cta.title", "Ready to run your shop on Madar?")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-white/70">
            {t(
              "landing.cta.subtitle",
              "Bring point of sale, costing, inventory and analytics into one bilingual system. Talk to us and we'll set you up.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" variant="brand" className="shadow-sm">
              <a href={loginUrl}>
                {startLabel} <ArrowRight className="size-4 rtl:rotate-180" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white dark:border-white/25 dark:bg-transparent"
            >
              <a href="mailto:hello@madar-pos.cloud">{t("landing.cta.contact", "Contact us")}</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ─────────────────────────────────────────────────────────────────── */

function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <img src="/madar.svg" alt="" className="h-5 opacity-70 dark:invert" />
        <p>{t("common.copyright", { year, defaultValue: `© ${year} Madar` })}</p>
      </div>
    </footer>
  );
}
