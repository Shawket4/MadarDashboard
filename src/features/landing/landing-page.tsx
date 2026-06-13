import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight, BarChart3, Building2, Languages, ShoppingCart, Sparkles, UtensilsCrossed, WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuthStore } from "@/data/stores/auth.store";
import { useAppStore } from "@/data/stores/app.store";

const FEATURES: { key: string; icon: LucideIcon }[] = [
  { key: "pos", icon: ShoppingCart },
  { key: "menu", icon: UtensilsCrossed },
  { key: "analytics", icon: BarChart3 },
  { key: "multibranch", icon: Building2 },
  { key: "offline", icon: WifiOff },
  { key: "bilingual", icon: Languages },
];

export function LandingPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const authed = useAuthStore((s) => !!s.token);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const cover = lang === "ar" ? "/cover_ar.svg" : "/cover_en.svg";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <img src="/sufrix.svg" alt={t("app.name", "Sufrix")} className="h-7 dark:invert" />
          <nav className="ms-6 hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">{t("landing.nav.pos", "Features")}</a>
            <a href="#contact" className="transition-colors hover:text-foreground">{t("landing.nav.contact", "Contact")}</a>
          </nav>
          <div className="ms-auto flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setLanguage(lang === "ar" ? "en" : "ar")} aria-label="Language"><Languages className="size-4" /></Button>
            <ThemeToggle />
            <Button asChild size="sm" className="ms-1"><Link to={authed ? "/" : "/login"}>{authed ? t("landing.openDashboard", "Open dashboard") : t("auth.signIn", "Sign in")}</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5 text-primary" /> {t("app.tagline", "Coffee Shop Management")}</span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t("landing.hero.title", "Run your coffee shop, end to end.")}</h1>
          <p className="max-w-md text-lg text-muted-foreground">{t("landing.hero.subtitle", "Point of sale, menu & recipe costing, inventory, shifts and analytics — one bilingual platform that works online and off.")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to={authed ? "/" : "/login"}>{authed ? t("landing.openDashboard", "Open dashboard") : t("landing.getStarted", "Get started")} <ArrowRight className="size-4 rtl:rotate-180" /></Link></Button>
            <Button asChild variant="outline" size="lg"><a href="#features">{t("landing.learnMore", "Learn more")}</a></Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/15 to-transparent blur-2xl" aria-hidden />
          <img src={cover} alt="" className="relative w-full rounded-2xl border shadow-xl" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("landing.featuresTitle", "Everything your counter needs")}</h2>
            <p className="mt-2 text-muted-foreground">{t("landing.featuresSubtitle", "Purpose-built for cafés and quick-service — fast, reliable, and bilingual.")}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
                <h3 className="mt-4 font-semibold">{t(`landing.features.${key}.title`, key)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`landing.features.${key}.desc`, "")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("landing.cta.title", "Ready to upgrade your operations?")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t("landing.cta.subtitle", "Sufrix is built to flex with your business. Contact our creator today to get started.")}</p>
          <div className="mt-6 flex justify-center">
            <Button asChild size="lg"><Link to={authed ? "/" : "/login"}>{authed ? t("landing.openDashboard", "Open dashboard") : t("landing.getStarted", "Get started")} <ArrowRight className="size-4 rtl:rotate-180" /></Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground sm:flex-row">
          <img src="/sufrix.svg" alt="" className="h-5 opacity-70 dark:invert" />
          <p>© 2026 {t("app.name", "Sufrix")}</p>
        </div>
      </footer>
    </div>
  );
}
