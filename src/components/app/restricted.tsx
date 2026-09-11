import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";

/**
 * A page somebody reached that is not theirs to use.
 *
 * The nav does not offer these, but a URL is a URL — a bookmark, a pasted link,
 * a browser that remembers. Rendering the real page and letting every request
 * inside it 403 is the worst version of this: a screen that looks broken rather
 * than one that says who it is for.
 *
 * The backend refuses these routes regardless. This exists so nobody is shown a
 * door that will not open.
 */
export function Restricted({ title, who }: { title: string; who?: string }) {
  const { t } = useTranslation();
  return (
    <Page>
      <PageHeader title={title} />
      <EmptyState
        icon={Lock}
        title={t("common.restrictedTitle", "Not available on this account")}
        description={
          who ??
          t("common.restrictedBody", "This is managed by Madar. Get in touch if you need a change here.")
        }
      />
    </Page>
  );
}
