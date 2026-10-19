/**
 * The Rewards teller page: set up once by the owner, then PIN, then the counter.
 *
 * The product's name is one i18n string, `rewardsTeller.productName`
 * ("Rewards by Madar" / "مكافآت من مدار"); the manifest and rewards.html
 * repeat it. The brand files are in public-rewards/ (see its README.md).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import i18n from "@/i18n";

import { CounterScreen } from "./counter-screen";
import { PinScreen } from "./pin-screen";
import { SetupScreen } from "./setup-screen";
import { type Session, type Setup, loadSession, loadSetup, saveSession, saveSetup } from "./session";

export function RewardsApp() {
  const { t } = useTranslation();
  const [setup, setSetup] = useState<Setup | null>(loadSetup);
  const [session, setSession] = useState<Session | null>(loadSession);

  const signIn = (s: Session) => {
    saveSession(s);
    setSession(s);
  };
  const signOut = () => {
    saveSession(null);
    setSession(null);
  };
  const reset = () => {
    saveSetup(null);
    signOut();
    setSetup(null);
  };
  const isAr = (i18n.resolvedLanguage ?? i18n.language).startsWith("ar");

  return (
    <div className="flex min-h-dvh flex-col gap-6 px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {/* The Ink tile with the present (design system svg/tile-ink.svg). */}
          <img src="/tile-ink.svg" alt="" className="size-8 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{t("rewardsTeller.productName", "Rewards by Madar")}</p>
            {setup ? <p className="truncate text-xs text-muted-foreground">{setup.branchName}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => void i18n.changeLanguage(isAr ? "en" : "ar")}>
            {isAr ? "English" : "العربية"}
          </Button>
          {session ? (
            <Button variant="ghost" size="sm" onClick={signOut} aria-label={t("rewardsTeller.signOut", "Sign out")}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{session.name}</span>
            </Button>
          ) : null}
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center">
        {!setup ? (
          <SetupScreen
            onDone={(s, owner) => {
              saveSetup(s);
              setSetup(s);
              signIn(owner);
            }}
          />
        ) : !session ? (
          <PinScreen setup={setup} onSignedIn={signIn} onReset={reset} />
        ) : (
          <CounterScreen setup={setup} onExpired={signOut} />
        )}
      </main>
    </div>
  );
}
