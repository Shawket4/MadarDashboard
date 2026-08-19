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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createFloorTable } from "@/data/api/generated/api";
import type { FloorSection, FloorTable } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { DEFAULT_TABLE_SIZE, GRID, invalidateFloor, snapTo } from "./util";

interface Props {
  branchId: string;
  /** Section preselected for the new table (the one being edited). */
  sectionId: string | null;
  sections: FloorSection[];
  /** Existing tables, used to suggest the next label and a free spawn spot. */
  tables: FloorTable[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated?: (table: FloorTable) => void;
}

/** Suggest "T7" style labels from the highest numeric suffix in use. */
const suggestLabel = (tables: FloorTable[]): string => {
  let max = 0;
  for (const tb of tables) {
    const m = /^T(\d+)$/i.exec(tb.label.trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `T${max + 1}`;
};

export function AddTableDialog({
  branchId, sectionId, sections, tables, open, onOpenChange, onCreated,
}: Props) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        label: z.string().min(1, t("common.requiredField", "This field is required")),
        seats: z.coerce.number<number>().int().min(0).max(99),
        shape: z.enum(["rect", "circle"]),
        section_id: z.string().nullable(),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;

  const form = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", seats: 2, shape: "rect", section_id: sectionId },
  });

  useEffect(() => {
    if (open) {
      form.reset({ label: suggestLabel(tables), seats: 2, shape: "rect", section_id: sectionId });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (v: Values) => {
    setBusy(true);
    try {
      const size = DEFAULT_TABLE_SIZE[v.shape];
      // There is no canvas centre to spawn into any more — the floor is
      // unbounded. Land beside the tables that are already here (or at the
      // origin for the first one), cascading so repeated adds stay visible.
      const siblings = tables.filter((tb) => (tb.section_id ?? null) === (v.section_id ?? null));
      const offset = (siblings.length % 5) * GRID * 3;
      const anchor = siblings.length
        ? {
            x: Math.min(...siblings.map((tb) => tb.pos_x)),
            y: Math.max(...siblings.map((tb) => tb.pos_y + tb.height)) + GRID * 2,
          }
        : { x: 0, y: 0 };
      const created = await createFloorTable({
        branch_id: branchId,
        label: v.label.trim(),
        seats: v.seats,
        shape: v.shape,
        section_id: v.section_id,
        pos_x: snapTo(anchor.x + offset, true),
        pos_y: snapTo(anchor.y, true),
        width: size.w,
        height: size.h,
        rotation: 0,
      });
      toast.success(t("floor.tableCreated", "Table created"));
      void invalidateFloor();
      onCreated?.(created);
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
          <DialogTitle>{t("floor.newTable", "New table")}</DialogTitle>
          <DialogDescription>
            {t("floor.tableHint", "Tables seat parties and back dine-in tickets.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField control={form.control} name="label" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("floor.tableLabel", "Label")}</FormLabel>
                <FormControl><Input placeholder="T1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="seats" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("floor.seats", "Seats")}</FormLabel>
                  <FormControl><Input type="number" min={0} max={99} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="shape" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("floor.shape", "Shape")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="rect">{t("floor.shapeRect", "Rectangle")}</SelectItem>
                      <SelectItem value="circle">{t("floor.shapeCircle", "Circle")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="section_id" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("floor.section", "Section")}</FormLabel>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                >
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">{t("floor.noSection", "No section")}</SelectItem>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" loading={busy}>{t("floor.addTable", "Add table")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
