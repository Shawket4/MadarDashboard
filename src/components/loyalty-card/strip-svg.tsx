/**
 * The strip (Apple) or the hero (Google) as madar-card draws it, live: the
 * same SVG the server rasterises, with the same two bundled faces (loaded
 * here from our own origin), so the browser draws the same glyphs.
 */
import { useEffect, useId, useMemo, useState } from "react";

import type { CardDesign } from "@/data/api/generated/models";
import type { CardRules, CardState, Store } from "@/lib/rules/card";
import { cn } from "@/lib/utils";

import { footerHref, loadCardFonts } from "./card-assets";

export function StripSvg({
  rules,
  design,
  state,
  store,
  scale = 2,
  photoUrl,
  logoUrl,
  primaryField = false,
  className,
  label,
}: {
  rules: CardRules;
  design: CardDesign;
  state: CardState;
  store: Store;
  scale?: number;
  photoUrl?: string | null;
  logoUrl?: string | null;
  primaryField?: boolean;
  className?: string;
  /** Accessible name of the picture; omitted = decorative. */
  label?: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [, setFontsReady] = useState(0);
  useEffect(() => {
    let live = true;
    void loadCardFonts().then(() => live && setFontsReady((n) => n + 1));
    return () => {
      live = false;
    };
  }, []);

  const svg = useMemo(() => {
    try {
      const raw = rules.card_svg(design, state, store, scale, {
        photo_href: design.ground.kind === "photo" ? (photoUrl ?? null) : null,
        logo_href: logoUrl ?? null,
        footer_href: footerHref(design.colours.foreground, state.arabic),
        scrim_preview: store === "apple" && primaryField,
        primary_field: store === "apple" && primaryField,
      });
      // The crate names its pattern "g" and its veil "v": unique per picture, as several share the page.
      return raw.replace(/id="(g|v)"/g, `id="$1${uid}"`).replace(/url\(#(g|v)\)/g, `url(#$1${uid})`);
    } catch {
      return "";
    }
  }, [rules, design, state, store, scale, photoUrl, logoUrl, primaryField, uid]);

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("[&>svg]:block [&>svg]:h-auto [&>svg]:w-full", className)}
      // The crate escapes every text and attribute it writes (render.rs `esc`); the hrefs are our own uploads.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
