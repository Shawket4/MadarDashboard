import type { ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/empty-state";

function ErrorFallback({ resetError }: { resetError: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-svh place-items-center p-6">
      <EmptyState
        icon={TriangleAlert}
        title={t("errors.boundaryTitle")}
        description={t("errors.boundaryDescription")}
        action={
          <Button variant="outline" onClick={resetError}>
            {t("errors.boundaryRetry")}
          </Button>
        }
        className="max-w-md border-destructive/30"
      />
    </div>
  );
}

/**
 * Top-level crash guard. Reports the render error to Sentry (when a DSN is
 * configured — otherwise it is a plain boundary) and shows a localized retry
 * screen instead of a blank page.
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={({ resetError }) => <ErrorFallback resetError={resetError} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
}
