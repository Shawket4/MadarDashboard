import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Coffee, Plus, Tag } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { useListCategories, useListMenuItems } from "@/shared/api/generated/api";
import { CategoryDialog } from "@/features/dialogs/category-dialog";
import { MenuItemEditor } from "@/features/dialogs/menu-item-editor";
import { getTranslatedName } from "@/shared/lib/translation";
import { fmtMoney } from "@/shared/lib/format";
import { StepFrame } from "./step-frame";

/**
 * Build your menu — two panes reusing the existing category and item dialogs.
 * The authoritative "done" check is the refetched onboarding steps, not the
 * local list lengths.
 */
export function StepMenu({ orgId, onMutated }: { orgId: string; onMutated: () => void }) {
  const { t, i18n } = useTranslation();
  const [catDlg, setCatDlg] = useState(false);
  const [itemDlg, setItemDlg] = useState(false);

  const { data: categories = [] } = useListCategories({ org_id: orgId }, { query: { enabled: !!orgId } });
  const { data: items = [] } = useListMenuItems({ org_id: orgId }, { query: { enabled: !!orgId } });

  return (
    <StepFrame title={t("onboarding.menu.title")} description={t("onboarding.menu.description")}>
      <div className="grid md:grid-cols-2 gap-4">
        {/* Categories pane */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{t("menu.categories")} ({categories.length})</p>
              <Button size="sm" variant="outline" onClick={() => setCatDlg(true)} className="gap-1">
                <Plus size={14} /> {t("common.add")}
              </Button>
            </div>
            {categories.length === 0 ? (
              <EmptyState icon={Tag} title={t("onboarding.menu.noCategories")} className="py-8" />
            ) : (
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/50">
                    <span>{getTranslatedName(c, i18n.language)}</span>
                    <Badge variant={c.is_active ? "success" : "secondary"}>
                      {c.is_active ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Items pane */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">{t("menu.items")} ({items.length})</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setItemDlg(true)}
                disabled={categories.length === 0}
                className="gap-1"
              >
                <Plus size={14} /> {t("common.add")}
              </Button>
            </div>
            {items.length === 0 ? (
              <EmptyState
                icon={Coffee}
                title={t("onboarding.menu.noItems")}
                description={categories.length === 0 ? t("onboarding.menu.categoryFirst") : undefined}
                className="py-8"
              />
            ) : (
              <ul className="space-y-1">
                {items.map((m) => (
                  <li key={m.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-muted/50">
                    <span>{getTranslatedName(m, i18n.language)}</span>
                    <span className="tabular text-muted-foreground">{fmtMoney(m.base_price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {catDlg && (
        <CategoryDialog open={catDlg} onClose={() => { setCatDlg(false); onMutated(); }} edit={null} orgId={orgId} />
      )}
      {itemDlg && (
        <MenuItemEditor
          open={itemDlg}
          onClose={() => { setItemDlg(false); onMutated(); }}
          edit={null}
          orgId={orgId}
          categories={categories}
        />
      )}
    </StepFrame>
  );
}
