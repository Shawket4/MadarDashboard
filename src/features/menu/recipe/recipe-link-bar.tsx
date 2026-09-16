import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Link2, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/app/confirm-dialog";
import { getErrorMessage } from "@/data/api/errors";
import { useAuthz } from "@/data/authz/use-authz";
import { Cap } from "@/generated/capabilities";

import { deleteRecipeLink, type RecipeLinkInfo } from "./modeling-api";

interface Props {
  itemId: string;
  sourceItemId: string | null;
  linkedCopyIds: string[];
  link: RecipeLinkInfo | undefined;
  /** Item names by id, for copy chips (falls back to a count). */
  nameOf: (id: string) => string | undefined;
  onChanged: () => void;
}

/** Studio header line: "Linked copies: X, Y" or "Recipe follows <item> [unlink]". */
export function RecipeLinkBar({ itemId, sourceItemId, linkedCopyIds, link, nameOf, onChanged }: Props) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const canEdit = useAuthz().can(Cap.menuItemsEdit);

  if (sourceItemId) {
    const name = link?.recipe_source_item_name ?? nameOf(sourceItemId) ?? "—";
    const unlink = async () => {
      const ok = await confirm({
        title: t("modeling.linked.unlinkTitle", "Unlink this recipe?"),
        description: t(
          "modeling.linked.unlinkDesc",
          "The current lines stay as this item's own recipe and stop following {{name}}.",
          { name },
        ),
        confirmLabel: t("modeling.linked.unlink", "Unlink"),
      });
      if (!ok) return;
      try {
        await deleteRecipeLink(itemId);
        toast.success(t("modeling.linked.unlinked", "Recipe unlinked"));
        onChanged();
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    };
    return (
      <span className="flex flex-wrap items-center gap-2 text-sm">
        <Link2 className="size-4 text-muted-foreground" aria-hidden="true" />
        {t("modeling.linked.follows", "Recipe follows")}
        <Link to="/menu/items/$itemId" params={{ itemId: sourceItemId }} search={{}} className="font-medium underline-offset-2 hover:underline">
          {name}
        </Link>
        {link?.in_sync === false ? (
          <Badge variant="outline">{t("modeling.linked.outOfSync", "Out of sync")}</Badge>
        ) : null}
        {canEdit ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => void unlink()}>
            <Unlink className="size-4" /> {t("modeling.linked.unlink", "Unlink")}
          </Button>
        ) : null}
      </span>
    );
  }

  if (linkedCopyIds.length === 0) return null;
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-sm">
      <Link2 className="size-4 text-muted-foreground" aria-hidden="true" />
      {t("modeling.linked.copies", "Linked copies:")}
      {linkedCopyIds.map((id, i) => (
        <span key={id}>
          <Link to="/menu/items/$itemId" params={{ itemId: id }} search={{}} className="font-medium underline-offset-2 hover:underline">
            {nameOf(id) ?? t("modeling.linked.copyN", "Copy {{n}}", { n: i + 1 })}
          </Link>
          {i < linkedCopyIds.length - 1 ? "," : null}
        </span>
      ))}
    </span>
  );
}
