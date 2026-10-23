/**
 * The Rewards teller page: set up once by the owner, then PIN, then the counter.
 *
 * The frame says three things at a glance, on every screen: which product and
 * branch this device stamps for, who is signed in, and whether the connection
 * is there. Everything a teller changes about the device (language, theme,
 * sound, switching staff, setting the device up again) is behind their name,
 * in one sheet that opens from the bottom, where a thumb is.
 *
 * The product's name is one i18n string, `rewardsTeller.productName`
 * ("Rewards by Madar" / "مكافآت من مدار"); the manifest and rewards.html
 * repeat it. The brand files are in public-rewards/ (see its README.md).
 */
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Languages, LogOut, Moon, RotateCcw, Sun, Volume2, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { usePublicTheme } from "@/features/public-shell/use-public-theme";
import i18n from "@/i18n";
import { cn } from "@/lib/utils";

import { CounterConfirm } from "./counter-confirm";
import { CounterScreen } from "./counter-screen";
import { PinScreen } from "./pin-screen";
import { SetupScreen } from "./setup-screen";
import {
  type Session,
  type Setup,
  clearRecent,
  loadSession,
  loadSetup,
  loadSound,
  saveSession,
  saveSetup,
  saveSound,
} from "./session";
import { useOnline } from "./use-online";

export function RewardsApp() {
  const { t } = useTranslation();
  const online = useOnline();
  const [setup, setSetup] = useState<Setup | null>(loadSetup);
  const [session, setSession] = useState<Session | null>(loadSession);
  const [expired, setExpired] = useState(false);
  const [menu, setMenu] = useState(false);

  const signIn = (s: Session) => {
    saveSession(s);
    setSession(s);
    setExpired(false);
  };
  const signOut = (why: "chose" | "expired" = "chose") => {
    saveSession(null);
    clearRecent();
    setSession(null);
    setMenu(false);
    setExpired(why === "expired");
  };
  const reset = () => {
    saveSetup(null);
    signOut();
    setSetup(null);
  };
  const isAr = (i18n.resolvedLanguage ?? i18n.language).startsWith("ar");
  const productName = t("rewardsTeller.productName", "Rewards by Madar");

  // The tab says the product's name in the page's language, like the other
  // public pages set theirs (rewards.html's <title> is the English one).
  useEffect(() => {
    document.title = productName;
  }, [productName]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/92 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* The present on its tile (design system svg/): Ink on light, Paper on dark. */}
            <img src="/tile-ink.svg" alt="" className="size-9 shrink-0 dark:hidden" />
            <img src="/tile-paper.svg" alt="" className="hidden size-9 shrink-0 dark:block" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">{productName}</p>
              {setup ? <p className="truncate text-sm text-muted-foreground">{setup.branchName}</p> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!online ? (
              <span
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--color-destructive)_14%,var(--color-card))] px-3 text-sm font-semibold text-[color-mix(in_oklab,var(--color-destructive)_55%,var(--color-foreground))]"
              >
                <WifiOff className="size-4" aria-hidden />
                {t("rewardsTeller.offline", "Offline")}
              </span>
            ) : null}
            {session ? (
              <Button
                variant="outline"
                className="h-11 gap-2 rounded-full ps-1.5 pe-3"
                aria-label={t("rewardsTeller.menuFor", "{{name}}: device menu", { name: session.name })}
                onClick={() => setMenu(true)}
              >
                <span aria-hidden className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {session.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="max-w-28 truncate text-sm font-semibold">{session.name}</span>
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
              </Button>
            ) : (
              <Button
                variant="outline"
                className="h-11 rounded-full px-4"
                lang={isAr ? "en" : "ar"}
                onClick={() => void i18n.changeLanguage(isAr ? "en" : "ar")}
              >
                <Languages className="size-4" aria-hidden />
                {isAr ? "English" : "العربية"}
              </Button>
            )}
          </div>
        </div>
        {!online ? (
          <p role="status" className="border-t bg-[color-mix(in_oklab,var(--color-destructive)_8%,var(--color-background))] px-4 py-2 text-center text-sm font-medium">
            {t("rewardsTeller.offlineBanner", "No connection. Cards can't be found or stamped until it's back.")}
          </p>
        ) : null}
      </header>

      <main className="flex flex-1 flex-col justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-8">
        {!setup ? (
          <SetupScreen
            onDone={(s, owner) => {
              saveSetup(s);
              setSetup(s);
              signIn(owner);
            }}
          />
        ) : !session ? (
          <PinScreen setup={setup} expired={expired} onSignedIn={signIn} onReset={reset} />
        ) : (
          <CounterScreen setup={setup} onExpired={() => signOut("expired")} />
        )}
      </main>

      {session && setup ? (
        <DeviceMenu
          open={menu}
          onOpenChange={setMenu}
          name={session.name}
          branch={setup.branchName}
          onSignOut={() => signOut()}
          onReset={reset}
        />
      ) : null}
    </div>
  );
}

function DeviceMenu({
  open,
  onOpenChange,
  name,
  branch,
  onSignOut,
  onReset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  name: string;
  branch: string;
  onSignOut: () => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  const theme = usePublicTheme();
  const [sound, setSound] = useState(loadSound);
  const [askReset, setAskReset] = useState(false);
  const lang = (i18n.resolvedLanguage ?? i18n.language).startsWith("ar") ? "ar" : "en";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 rounded-t-[28px] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:mx-auto sm:max-w-md"
        >
          <span aria-hidden className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          <SheetTitle className="text-xl font-semibold">{name}</SheetTitle>
          <SheetDescription className="text-base">
            {t("rewardsTeller.menuSignedIn", "Signed in at {{branch}}", { branch })}
          </SheetDescription>

          <div className="mt-5 space-y-4">
            <Segmented
              label={t("rewardsTeller.language", "Language")}
              value={lang}
              options={[
                { value: "en", label: "English", lang: "en" },
                { value: "ar", label: "العربية", lang: "ar" },
              ]}
              onChange={(v) => void i18n.changeLanguage(v)}
            />
            <Segmented
              label={t("rewardsTeller.theme", "Theme")}
              value={theme.mode}
              options={[
                { value: "light", label: t("rewardsTeller.themeLight", "Light"), icon: <Sun className="size-4" aria-hidden /> },
                { value: "dark", label: t("rewardsTeller.themeDark", "Dark"), icon: <Moon className="size-4" aria-hidden /> },
              ]}
              onChange={(v) => theme.setMode(v as "light" | "dark")}
            />
            <label className="flex h-14 items-center justify-between gap-3 rounded-2xl border bg-card px-4">
              <span className="inline-flex items-center gap-2.5 text-base font-medium">
                <Volume2 className="size-5 text-muted-foreground" aria-hidden />
                {t("rewardsTeller.sound", "Sound on stamp and refusal")}
              </span>
              <Switch
                checked={sound}
                onCheckedChange={(on) => {
                  setSound(on);
                  saveSound(on);
                }}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3">
            <Button className="h-14 rounded-2xl text-base" onClick={onSignOut}>
              <LogOut className="size-5 rtl:rotate-180" aria-hidden />
              {t("rewardsTeller.signOut", "Sign out")}
            </Button>
            <Button variant="ghost" className="h-12 rounded-2xl text-base text-muted-foreground" onClick={() => setAskReset(true)}>
              <RotateCcw className="size-4" aria-hidden />
              {t("rewardsTeller.setupAgain", "Set this device up again")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <CounterConfirm
        ask={
          askReset
            ? {
                figure: <RotateCcw className="mx-auto size-14" strokeWidth={1.5} />,
                title: t("rewardsTeller.resetTitle", "Set this device up again?"),
                body: t("rewardsTeller.resetBody", "The shop owner will need to sign in with their email and password before staff can use it."),
                yes: t("rewardsTeller.resetYes", "Set up again"),
              }
            : null
        }
        onAnswer={(yes) => {
          setAskReset(false);
          if (yes) onReset();
        }}
      />
    </>
  );
}

/** Two big choices side by side; the chosen one is filled. */
function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string; lang?: string; icon?: ReactNode }[];
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="space-y-1.5">
      <p aria-hidden className="text-sm font-medium text-muted-foreground">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              lang={o.lang}
              onClick={() => onChange(o.value)}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-xl text-base font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
                on ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
