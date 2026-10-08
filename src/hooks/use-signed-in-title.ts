import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * The tab's title once someone is signed in to the dashboard.
 *
 * index.html titles the page for a visitor who arrives signed out — "Madar POS
 * — Sign in", or "Madar POS — Live demo" on the demo — because that is what a
 * search engine and a link preview see. Inside, nothing else sets a title, so
 * without this every signed-in tab would still say "Sign in". On sign-out the
 * page's own title comes back.
 */
export function useSignedInTitle(signedIn: boolean) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!signedIn) return;
    const before = document.title;
    document.title = t("app.documentTitle", "Madar POS");
    return () => {
      document.title = before;
    };
  }, [signedIn, t]);
}
