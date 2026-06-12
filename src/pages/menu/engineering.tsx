import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageShell } from "@/shared/ui/page-shell";
import { usePermissions } from "@/shared/hooks/use-permissions";
import { MenuEngineeringScreen } from "@/features/menu-engineering";

export default function MenuEngineeringPage() {
  const { t } = useTranslation();
  const { can, isLoading } = usePermissions();

  if (!isLoading && !can("orders", "read")) return <Navigate to="/" replace />;

  return (
    <PageShell title={t("menuEngineering.title")} description={t("menuEngineering.subtitle")}>
      <MenuEngineeringScreen />
    </PageShell>
  );
}
