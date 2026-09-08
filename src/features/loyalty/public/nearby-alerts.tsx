/**
 * How to make the card appear when the customer is at the shop.
 *
 * The pass carries the branches' coordinates, and both wallets will surface it
 * on the lock screen near one — but only if the WALLET APP has been allowed to
 * use location. That permission belongs to Apple Wallet or Google Wallet, not
 * to this page, and no amount of JavaScript can request it on their behalf: a
 * web page can ask for ITS own notifications and ITS own geolocation, neither
 * of which has anything to do with whether a pass surfaces.
 *
 * So this does the honest thing and points at where the switch actually lives,
 * in the words of the platform the customer is holding. It is collapsed by
 * default, because most people either have it on already or do not care, and
 * a card page is not the place to lecture.
 *
 * Only rendered when the pass HAS locations (`passes.nearby`). Telling someone
 * to enable a feature that cannot fire — because nobody put coordinates on a
 * branch — is worse than staying quiet: they would follow the steps and still
 * see nothing.
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, ChevronDown, ExternalLink } from "lucide-react";

import { Panel } from "./page-shell";
import { detectWallet } from "./detect-wallet";

/**
 * Opens the Google Wallet app on Android, falling back to its store page.
 *
 * Chrome resolves this intent form itself; if the app is absent it follows
 * `browser_fallback_url` rather than failing silently. There is no equivalent
 * for iOS — `App-Prefs:` is private and Safari refuses it — so the Apple side
 * is instructions only, which is what Apple's own support pages give too.
 */
const GOOGLE_WALLET_INTENT =
  "intent://#Intent;package=com.google.android.apps.walletnfcrel;" +
  "S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3D" +
  "com.google.android.apps.walletnfcrel;end";

export function NearbyAlerts({ accent }: { accent?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wallet = detectWallet();

  // Steps for the platform in hand. A desktop visitor gets the Apple set,
  // since they are most likely about to add the pass through iCloud — and
  // either way both are one tap away behind the toggle.
  const steps =
    wallet === "google"
      ? [
          t(
            "loyalty.nearby.g1",
            "Open Google Wallet and tap your profile picture.",
          ),
          t(
            "loyalty.nearby.g2",
            "Go to Settings, then turn on notifications for passes.",
          ),
          t(
            "loyalty.nearby.g3",
            "Allow Google Wallet to use your location — “While using the app” is enough.",
          ),
        ]
      : [
          t(
            "loyalty.nearby.a1",
            "Open Settings, then Privacy & Security, then Location Services.",
          ),
          t(
            "loyalty.nearby.a2",
            "Choose Wallet and set it to “While Using the App”.",
          ),
          t(
            "loyalty.nearby.a3",
            "In Wallet, tap the card, then the three dots, and turn on Allow Notifications.",
          ),
        ];

  return (
    <Panel className="p-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start"
      >
        <Bell
          className="size-4 shrink-0"
          style={accent ? { color: accent } : undefined}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">
            {t("loyalty.nearby.title", "Get a reminder when you're here")}
          </span>
          <span className="block text-xs text-muted-foreground">
            {t(
              "loyalty.nearby.subtitle",
              "Your card can appear on your lock screen near the shop.",
            )}
          </span>
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-border/70 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(
              "loyalty.nearby.why",
              "Your wallet app decides this, not us — it needs permission to use your location. It takes a few seconds:",
            )}
          </p>
          <ol className="flex flex-col gap-2 text-sm">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-2.5">
                <span
                  className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold tabular-nums"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          {wallet === "google" ? (
            <a
              href={GOOGLE_WALLET_INTENT}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
              style={accent ? { color: accent } : undefined}
            >
              <ExternalLink className="size-3.5" aria-hidden />
              {t("loyalty.nearby.openWallet", "Open Google Wallet")}
            </a>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
