/**
 * Where else to find the shop, as a row of links a thumb can hit.
 *
 * The same links, in the same order, as the back of the wallet pass — the
 * server reads both from one place (`orgs::social`), and a page that listed a
 * different set from the card in the phone would be a page nobody could trust.
 * A shop with none renders NOTHING: no heading, no empty row, no placeholder
 * inviting them to add some. This is the customer's page, not the shop's.
 *
 * ## The glyphs are drawn here
 * lucide dropped its brand icons — the whole set, not just the ones that
 * lapsed — so there is no `Instagram` or `Facebook` to import in this version.
 * Five are inline: the shapes are simple, the licences permit it (lucide's
 * retired outlines are ISC; the X and TikTok marks are the CC0 Simple Icons
 * paths), and a customer recognises a platform by its mark long before they
 * read its name. WhatsApp and a website have honest stand-ins in lucide.
 *
 * Every link is labelled with the platform's NAME as well, so the glyph is
 * never the only thing identifying a link, and a platform the server learns
 * before this page does still renders — under its wire label, with a globe.
 *
 * Opens in a new tab: someone tapping Instagram from their loyalty card has
 * not finished with their loyalty card.
 */
import type { ComponentType, SVGProps } from "react";
import { useTranslation } from "react-i18next";
import { Globe, MessageCircle } from "lucide-react";

import type { PublicSocialLink } from "@/data/api/generated/models/publicSocialLink";

import { Section } from "./page-shell";

type Glyph = ComponentType<SVGProps<SVGSVGElement>>;

/** A 24-box outline in lucide's grammar, so it sits beside lucide's own. */
function Outline({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/**
 * A filled mark, inset so its mass matches a 2px outline at the same size —
 * a solid glyph at full bleed reads a weight heavier than the line icons
 * either side of it.
 */
function Solid({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-3 -3 30 30" fill="currentColor" aria-hidden {...props}>
      {children}
    </svg>
  );
}

const Instagram: Glyph = (p) => (
  <Outline {...p}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </Outline>
);

const Facebook: Glyph = (p) => (
  <Outline {...p}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </Outline>
);

const YouTube: Glyph = (p) => (
  <Outline {...p}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </Outline>
);

const TikTok: Glyph = (p) => (
  <Solid {...p}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </Solid>
);

const X: Glyph = (p) => (
  <Solid {...p}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </Solid>
);

/** Keyed by `orgs::social::PLATFORMS`. Anything else falls to the globe. */
const GLYPHS: Record<string, Glyph> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: TikTok,
  x: X,
  youtube: YouTube,
  whatsapp: MessageCircle,
  website: Globe,
};

/**
 * The server already refuses anything that is not `https`, on write and on
 * read. Checked once more here because these are `href`s on a public page
 * and the cost of the check is one string comparison.
 */
const isSafe = (url: string): boolean => /^https:\/\/\S+$/.test(url);

export function SocialLinks({
  links,
  accent,
}: {
  links: PublicSocialLink[] | undefined;
  /** The shop's accent, already made legible on this page. */
  accent: string;
}) {
  const { t } = useTranslation();
  const shown = (links ?? []).filter((l) => isSafe(l.url));
  if (shown.length === 0) return null;

  return (
    <Section title={t("loyalty.findUs", "Find us")}>
      <ul className="flex flex-wrap gap-2">
        {shown.map((l) => {
          const Icon = GLYPHS[l.key] ?? Globe;
          // The platform's name in the reader's language where we have one,
          // and whatever the wire called it where we do not.
          const label = t(`loyalty.social.${l.key}`, { defaultValue: l.label });
          return (
            <li key={l.key}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-card pe-4 ps-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none"
              >
                <Icon className="size-[18px] shrink-0" style={{ color: accent }} />
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
