import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";

import { FoodicsImportDialog } from "./foodics-import-dialog";
import { modeFor } from "./util";

/**
 * "Import from Foodics" on the Setup page's menu row: import the whole menu
 * from the console's exports, or replace the menu there is with them. Shown
 * only to someone who holds what the server will ask for.
 */
export function FoodicsImportButton({
  orgId,
  live,
  refresh,
  variant = "default",
}: {
  orgId: string;
  /** What the shop has: an empty menu adds, any other replaces. */
  live: { categories: number; items: number };
  refresh: () => void;
  variant?: "default" | "outline";
}) {
  const { t } = useTranslation();
  const { can } = useAuthz();
  const [open, setOpen] = useState(false);
  const canAdd =
    can(Cap.menuCategoriesCreate) &&
    can(Cap.menuItemsCreate) &&
    can(Cap.menuItemsEdit);
  const canReplace =
    canAdd && can(Cap.menuCategoriesDelete) && can(Cap.menuItemsDelete);
  const mode = modeFor(live);
  if (!canAdd || (mode === "replace" && !canReplace)) return null;

  return (
    <>
      <Button size="sm" variant={variant} onClick={() => setOpen(true)}>
        <FileSpreadsheet aria-hidden="true" />
        {mode === "replace"
          ? t("menuImport.cardReplaceCta", "Replace from Foodics")
          : t("menuImport.cardCta", "Import from Foodics")}
      </Button>
      <FoodicsImportDialog
        orgId={orgId}
        mode={mode}
        canReplace={canReplace}
        open={open}
        onOpenChange={setOpen}
        onImported={refresh}
      />
    </>
  );
}
