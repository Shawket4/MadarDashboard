/**
 * The shop's own web addresses — the thing a manager actually needs from the
 * branding tier and the one thing the dashboard never told them.
 *
 * Copy buttons rather than links: these are going onto a menu, a receipt
 * footer, an Instagram bio and a window sticker, so what matters is getting
 * the exact string out of the page and into somewhere else. They open too,
 * because seeing it is how you believe it.
 */
import { useState } from "react";
import { Check, Copy, ExternalLink, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { publicRootDomain, shopAddresses, type ShopAddress } from "./shop-address";

/** Label and one line of "what is this for", per surface. */
function useLabels(): Record<ShopAddress["key"], { title: string; hint: string }> {
  const { t } = useTranslation();
  return {
    card: {
      title: t("settings.address.card", "Loyalty card"),
      hint: t("settings.address.cardHint", "Where customers sign up and open their card."),
    },
    order: {
      title: t("settings.address.order", "Menu and ordering"),
      hint: t("settings.address.orderHint", "Your menu, for a QR code on the table or a link in a bio."),
    },
    book: {
      title: t("settings.address.book", "Bookings"),
      hint: t("settings.address.bookHint", "Where guests reserve a table."),
    },
  };
}

export function ShopAddressCard({
  slug,
  customBranding,
}: {
  slug?: string | null;
  customBranding: boolean;
}) {
  const { t } = useTranslation();
  const labels = useLabels();
  const [copied, setCopied] = useState<string | null>(null);

  const root = publicRootDomain(
    import.meta.env.VITE_API_URL as string | undefined,
    typeof window === "undefined" ? undefined : window.location.hostname,
  );
  const addresses = shopAddresses(slug, root);

  // Off the tier there is no subdomain, and in local development there is no
  // domain to make one under. Both cases say nothing rather than print an
  // address that does not resolve.
  if (!customBranding || addresses.length === 0) return null;

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied((c) => (c === url ? null : c)), 2000);
    } catch {
      toast.error(t("common.copyFailed", "Copy failed"));
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-2.5">
          <Globe aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("settings.address.title", "Your web address")}</p>
            <p className="text-xs text-muted-foreground">
              {t(
                "settings.address.hint",
                "Your customer pages are on your own address. These are safe to print — they do not change.",
              )}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {addresses.map(({ key, url }) => (
            <li
              key={key}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border/70 bg-muted/30 p-3"
            >
              {/* `min-w-0` is load-bearing: a flex child defaults to
                  `min-width:auto`, so a long address refuses to shrink and
                  pushes the buttons off the card instead of truncating. */}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{labels[key].title}</p>
                {/* The address itself reads left-to-right even in Arabic — a
                    URL is not prose, and bidi reordering makes it wrong. */}
                <p dir="ltr" className="truncate font-mono text-sm" title={url}>
                  {url}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{labels[key].hint}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void copy(url)}
                  aria-label={t("common.copy", "Copy")}
                >
                  {copied === url ? (
                    <Check className="size-4 text-success" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label={t("common.open", "Open")}
                >
                  <a href={url} target="_blank" rel="noreferrer noopener">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
