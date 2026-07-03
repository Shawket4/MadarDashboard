import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BilingualField } from "@/components/app/bilingual-field";
import { ImageUploader } from "@/components/app/image-uploader";
import {
  useUpdateMenuItem,
  useListCategories,
  uploadMenuItemImage,
} from "@/data/api/generated/api";
import type { StudioAggregate, UploadResponse } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";
import { CategoryDialog } from "@/features/menu/category-dialog";
import { arOf } from "./util";
import { StudioSection } from "./studio-section";
import { useState } from "react";

interface Props {
  studio: StudioAggregate;
  itemId: string;
  orgId: string | null;
  onSaved: () => void;
}

const imageUrlOf = (res: UploadResponse): string => {
  const r = res as { image_url?: string; url?: string };
  return r.image_url ?? r.url ?? "";
};

export function BasicsTab({ studio, itemId, orgId, onSaved }: Props) {
  const { t, i18n } = useTranslation();
  const [newCategory, setNewCategory] = useState(false);
  const categories = useListCategories({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const catList = categories.data ?? [];

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
        name_ar: z.string().optional(),
        description: z.string().optional(),
        description_ar: z.string().optional(),
        category_id: z.string().optional(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: studio.name,
      name_ar: arOf(studio.name_translations),
      description: studio.description ?? "",
      description_ar: "",
      category_id: studio.category_id ?? "",
      is_active: studio.is_active,
    },
  });

  // Re-seed the form whenever the aggregate is re-fetched (e.g. after save).
  useEffect(() => {
    form.reset({
      name: studio.name,
      name_ar: arOf(studio.name_translations),
      description: studio.description ?? "",
      description_ar: "",
      category_id: studio.category_id ?? "",
      is_active: studio.is_active,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.catalog_revision]);

  const save = useUpdateMenuItem({
    mutation: {
      onSuccess: () => {
        toast.success(t("common.savedChanges", "Changes saved"));
        onSaved();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    },
  });

  const onSubmit = (v: Values) =>
    save.mutate({
      id: itemId,
      data: {
        name: v.name,
        name_translations: v.name_ar ? { ar: v.name_ar } : {},
        description: v.description || null,
        description_translations: v.description_ar ? { ar: v.description_ar } : {},
        category_id: v.category_id || null,
        is_active: v.is_active,
      },
    });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <StudioSection
            title={t("menu.studio.basics.title", "Item details")}
            description={t("menu.studio.basics.desc", "The name, description and category customers see.")}
          >
            <div className="space-y-4">
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
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={t("menu.selectCategory", "Select category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {catList.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {getTranslatedName({ name: c.name, name_translations: c.name_translations }, i18n.language)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    <FormItem className="flex items-center gap-3 pt-6">
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
          </StudioSection>

          <StudioSection
            title={t("menu.itemImage", "Image")}
            description={t("menu.studio.basics.imageDesc", "Shown on the storefront and POS. PNG/JPG/WebP, up to 5 MB.")}
          >
            <div className="max-w-sm">
              <ImageUploader
                value={studio.image_url}
                onUpload={async (file) => {
                  const res = await uploadMenuItemImage(itemId, { image: file });
                  onSaved();
                  return imageUrlOf(res);
                }}
                onRemove={
                  studio.image_url
                    ? async () => {
                        await save.mutateAsync({ id: itemId, data: { image_url: null } });
                      }
                    : undefined
                }
                hint={t("menu.imageHint", "PNG/JPG/WebP, up to 5 MB")}
              />
            </div>
          </StudioSection>

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" loading={save.isPending}>
              {t("common.save", "Save")}
            </Button>
          </div>
        </form>
      </Form>

      {newCategory && orgId ? (
        <CategoryDialog
          orgId={orgId}
          category={null}
          open={newCategory}
          onOpenChange={setNewCategory}
          onCreated={(cat) => form.setValue("category_id", cat.id, { shouldValidate: true })}
        />
      ) : null}
    </>
  );
}
