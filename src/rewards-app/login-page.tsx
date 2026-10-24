/**
 * Rewards by Madar's sign-in: the same account as the Madar dashboard (one
 * email, one password), in Rewards' own frame. Signed in there already, this
 * page is never seen: the shared session signs this app in at boot.
 */
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { LoginForm } from "@/features/auth/login-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { Reveal } from "@/lib/motion";

import { RewardsLockup } from "./brand";
import { afterSignIn } from "./paths";

export function RewardsLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { redirect?: string };

  const onSignedIn = () => {
    const target = new URL(afterSignIn(search.redirect), window.location.origin);
    void navigate({
      to: target.pathname,
      search: Object.fromEntries(target.searchParams) as never,
      replace: true,
    });
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* The brand panel: Ink in both themes, the present on its tile. */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-e border-sidebar-border bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <span className="flex items-center gap-3">
          <img src="/tile-paper.svg" alt="" className="size-10" />
          <span className="leading-tight">
            <span className="block text-lg font-semibold tracking-tight">{t("rewardsApp.wordmark", "Rewards")}</span>
            <span className="block text-sm text-sidebar-muted">{t("rewardsApp.byMadar", "by Madar")}</span>
          </span>
        </span>
        <div className="max-w-md">
          <img src="/symbol-paper.svg" alt="" className="mb-8 size-20 opacity-90" />
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            {t("rewardsApp.login.pitch", "Your regulars, on a card in their phone.")}
          </p>
          <p className="mt-4 text-base text-sidebar-muted">
            {t("rewardsApp.login.pitchSub", "Stamps and points, the card's design, and messages that land on it.")}
          </p>
        </div>
        <p className="text-sm text-sidebar-muted">{t("rewardsApp.login.sameAccount", "One account with the Madar dashboard.")}</p>
      </aside>

      <main className="flex min-h-dvh flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center justify-between gap-2">
          <RewardsLockup className="lg:invisible" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
        <Reveal className="m-auto w-full max-w-sm py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{t("rewardsApp.login.title", "Sign in to Rewards")}</h1>
          <p className="mt-1.5 mb-8 text-sm text-muted-foreground">
            {t("rewardsApp.login.subtitle", "Use your Madar account: the same email and password as the dashboard.")}
          </p>
          <LoginForm onSignedIn={onSignedIn} />
        </Reveal>
      </main>
    </div>
  );
}
