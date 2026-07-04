import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import { ImageUploader } from "@/components/app/image-uploader";
import { Combobox } from "@/components/app/combobox";
import { useListCategories } from "@/data/api/generated/api";
import { getTranslatedName } from "@/lib/translation";
import { CategoryDialog } from "@/features/menu/category-dialog";
import type { ItemDraftValues } from "./util";

interface Props {
  form: UseFormReturn<ItemDraftValues>;
  orgId: string | null;
  /** What the uploader shows: pending preview ?? server image (unless removed). */
  imageUrl: string | null;
  /** Stage a picked file — uploaded by the batched save, not immediately. */
  onPickImage: (file: File) => void;
  /** Stage image removal (or drop the pending file). Absent = nothing to remove. */
  onRemoveImage?: () => void;
}

/**
 * Section 1 — Item: image, bilingual name/description, category, active switch.
 * All edits are drafts in the page's dirty store; nothing writes until Save.
 */
export function SectionItem({ form, orgId, imageUrl, onPickImage, onRemoveImage }: Props) {
  const { t, i18n } = useTranslation();
  const [newCategory, setNewCategory] = useState(false);

  const categories = useListCategories({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const catList = useMemo(() => categories.data ?? [], [categories.data]);
  const categoryOptions = useMemo(
    () =>
      catList.map((c) => ({
        value: c.id,
        label: getTranslatedName({ name: c.name, name_translations: c.name_translations }, i18n.language),
      })),
    [catList, i18n.language],
  );

  return (
    <>
      <Form {...form}>
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="shrink-0">
            <ImageUploader
              value={imageUrl}
              onUpload={(file) => {
                onPickImage(file);
                return Promise.resolve("");
              }}
              onRemove={onRemoveImage}
              hint={t("menu.imageHint", "PNG/JPG/WebP, up to 5 MB")}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <BilingualField control={form.control} enName="name" arName="name_ar" label={t("common.name", "Name")} />
            <BilingualField
              control={form.control}
              enName="description"
              arName="description_ar"
              label={t("common.description", "Description")}
              textarea
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.category", "Category")}</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <div className="min-w-0 flex-1">
                          <Combobox
                            options={categoryOptions}
                            value={field.value || null}
                            onChange={field.onChange}
                            placeholder={t("menu.selectCategory", "Select category")}
                          />
                        </div>
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title={t("menu.newCategory", "New category")}
                        onClick={() => setNewCategory(true)}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 sm:pt-6">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-0.5">
                      <FormLabel className="!mt-0">{t("common.active", "Active")}</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        {t("menu.studio.basics.activeHint", "Inactive items are hidden from every menu.")}
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </Form>

      {newCategory && orgId ? (
        <CategoryDialog
          orgId={orgId}
          category={null}
          open={newCategory}
          onOpenChange={setNewCategory}
          onCreated={(cat) => form.setValue("category_id", cat.id, { shouldDirty: true })}
        />
      ) : null}
    </>
  );
}
