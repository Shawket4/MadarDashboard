import { Construction } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";

/** Placeholder for routes that exist in the shell but are rebuilt in a later phase. */
export function ComingSoon({ title, description }: { title: string; description?: string }) {
  const { t } = useTranslation();
  return (
    <Page>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title={t("common.comingSoon", "Coming soon")}
        description={t(
          "common.comingSoonDesc",
          "This screen is being rebuilt as part of the new Madar experience.",
        )}
      />
    </Page>
  );
}

/** Build a route component that renders a translated ComingSoon placeholder. */
export function makeComingSoon(titleKey: string, fallback: string) {
  return function ComingSoonRoute() {
    const { t } = useTranslation();
    return <ComingSoon title={t(titleKey, fallback)} />;
  };
}
