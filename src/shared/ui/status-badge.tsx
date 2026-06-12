import { useTranslation } from "react-i18next";
import { Badge } from "./badge";

/** The standard active/inactive badge. */
export function StatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation();
  return (
    <Badge variant={active ? "success" : "secondary"}>
      {active ? t("common.active") : t("common.inactive")}
    </Badge>
  );
}
