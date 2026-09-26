import { useLayoutEffect } from "react";

import { brandTokens } from "./brand-color";
import { usePublicTheme } from "./use-public-theme";

/**
 * Paint the shop's colour into the storefront's tokens, on `<html>`.
 *
 * `.brand-surface` binds `--primary` to Madar teal, and every control in the
 * shared kit reads it — so until this existed, a shop's page wore its logo and
 * a wash of its colour over teal buttons, teal category chips, a teal cart pill
 * and teal checkboxes. The loyalty pages rebound the token on their own column,
 * which fixed the buttons IN it and none of the sheets and dialogs, because a
 * Radix portal renders into `<body>` — outside any subtree.
 *
 * The root is the one element every portal inherits from. Recomputed on the
 * theme toggle, because the walk to AA is against the ground in force, and
 * removed on unmount or when the shop is unknown, so the Madar tokens return.
 *
 * Only on a storefront (`.brand-surface`): the links page is also previewed
 * INSIDE the dashboard, and a preview must not recolour the tool around it.
 */
export function useBrandSkin(color: string | null | undefined): void {
  const mode = usePublicTheme((s) => s.mode);

  // Layout, not passive: the tokens land before the first paint that has the
  // shop's logo, rather than one frame of teal later.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("brand-surface")) return;
    const tokens = brandTokens(color, mode === "dark" ? "dark" : "light");
    if (!tokens) return;
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
    return () => {
      for (const name of Object.keys(tokens)) root.style.removeProperty(name);
    };
  }, [color, mode]);
}
