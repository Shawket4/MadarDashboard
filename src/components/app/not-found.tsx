import { Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { EmptyState } from "./empty-state";

/** An address that leads nowhere: a page with a way back (TanStack's default is a bare "Not Found"). */
export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <EmptyState
        icon={Compass}
        title={t("notFound.title", "Page not found")}
        description={t("notFound.body", "This page doesn't exist or has moved. Check the address, or go back to the dashboard.")}
        action={
          <Button variant="outline" asChild>
            <Link to="/">{t("notFound.home", "Back to the dashboard")}</Link>
          </Button>
        }
      />
    </div>
  );
}
