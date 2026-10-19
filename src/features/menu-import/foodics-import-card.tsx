import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";

import { FoodicsImportDialog } from "./foodics-import-dialog";
import { modeFor } from "./util";

/**
 * "Already on Foodics?" in the onboarding menu stage: import the whole menu
 * from the console's exports, or replace the menu there is with them. Shown
 * only to someone who holds what the server will ask for.
 */
export function FoodicsImportCard({
  orgId,
  live,
  refresh,
}: {
  orgId: string;
  /** What the checklist counts: an empty menu adds, any other replaces. */
  live: { categories: number; items: number };
  refresh: () => void;
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
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
      <FileSpreadsheet
        className="size-6 shrink-0 text-primary"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {t("menuImport.cardTitle", "Already on Foodics?")}
        </p>
        <p className="text-sm text-muted-foreground">
          {mode === "replace"
            ? t(
                "menuImport.cardReplace",
                "Replace this menu with the one you have in Foodics, in one go.",
              )
            : t(
                "menuImport.cardAdd",
                "Bring your whole menu over from Foodics: categories, items, sizes and choices.",
              )}
        </p>
      </div>
      <Button variant="outline" onClick={() => setOpen(true)}>
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
    </div>
  );
}
