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
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createFloorTable, updateFloorTable } from "@/data/api/generated/api";
import type { FloorSection, FloorTable } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { invalidateFloor } from "./util";

interface Props {
  branchId: string;
  sectionId: string | null;
  sections: FloorSection[];
  table: FloorTable | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function TableDialog({ branchId, sectionId, sections, table, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const editing = !!table;

  const schema = useMemo(
    () =>
      z.object({
        label: z.string().min(1, t("common.requiredField", "This field is required")),
        seats: z.coerce.number<number>().int().min(0).max(99),
        shape: z.enum(["rect", "circle"]),
        section_id: z.string().nullable(),
        is_active: z.boolean(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", seats: 2, shape: "rect", section_id: sectionId, is_active: true },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        label: table?.label ?? "",
        seats: table?.seats ?? 2,
        shape: (table?.shape as "rect" | "circle") ?? "rect",
        section_id: table?.section_id ?? sectionId,
        is_active: table?.is_active ?? true,
      });
    }
  }, [open, table]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      if (table) {
        await updateFloorTable(table.id, {
          label: v.label.trim(),
          seats: v.seats,
          shape: v.shape,
          section_id: v.section_id,
          is_active: v.is_active,
        });
        toast.success(t("reservations.tableUpdated", "Table updated"));
      } else {
        await createFloorTable({
          branch_id: branchId,
          label: v.label.trim(),
          seats: v.seats,
          shape: v.shape,
          section_id: v.section_id,
        });
        toast.success(t("reservations.tableCreated", "Table created"));
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? t("reservations.editTable", "Edit table") : t("reservations.newTable", "New table")}</DialogTitle>
          <DialogDescription>{t("reservations.tableHint", "Tables seat parties and back dine-in tickets.")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="label" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservations.tableLabel", "Label")}</FormLabel>
                <FormControl><Input placeholder="T1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="seats" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.seats", "Seats")}</FormLabel>
                  <FormControl><Input type="number" min={0} max={99} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shape" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("reservations.shape", "Shape")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="rect">{t("reservations.shapeRect", "Rectangle")}</SelectItem>
                      <SelectItem value="circle">{t("reservations.shapeCircle", "Circle")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="section_id" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservations.section", "Section")}</FormLabel>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                >
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t("reservations.noSection", "No section")}</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            {editing ? (
              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel>{t("common.active", "Active")}</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel", "Cancel")}</Button>
              <Button type="submit" disabled={busy}>{busy ? t("common.saving", "Saving…") : t("common.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
