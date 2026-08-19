import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createSection, updateSection } from "@/data/api/generated/api";
import type { FloorSection } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateFloor } from "./util";

interface Props {
  branchId: string;
  /** Editing target; `null` creates a new section. */
  section: FloorSection | null;
  /** Ordering slot for a newly created section (append at the end). */
  nextOrdering: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (id: string) => void;
}

/** Create / rename a section and edit its canvas size. */
export function SectionDialog({ branchId, section, nextOrdering, open, onOpenChange, onCreated }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const editing = !!section;

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t("common.requiredField", "This field is required")),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: section?.name ?? "",
      });
    }
  }, [open, section]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      if (section) {
        await updateSection(section.id, { name: v.name.trim() });
        toast.success(t("floor.sectionUpdated", "Section updated"));
      } else {
        const created = await createSection({
          branch_id: branchId,
          name: v.name.trim(),
          ordering: nextOrdering,
        });
        toast.success(t("floor.sectionCreated", "Section created"));
        onCreated?.(created.id);
      }
      void invalidateFloor();
      onOpenChange(false);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {editing ? t("floor.sectionSettings", "Section settings") : t("floor.newSection", "New section")}
          </DialogTitle>
          <DialogDescription>
            {t("floor.sectionHint", "A section is one area of the floor — a room, terrace, or level — with its own canvas.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("floor.sectionName", "Name")}</FormLabel>
                <FormControl><Input placeholder={t("floor.sectionNamePlaceholder", "Main hall")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" loading={busy}>{t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
