import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ArrowDownCircle, ArrowUpCircle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/shared/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form";
import { useOpenShift, useCloseShift, useForceCloseShift, useAddCashMovement, getListShiftsQueryKey, getGetCurrentShiftQueryKey } from "@/shared/api/generated/api";
import { openShiftSchema, closeShiftSchema, forceCloseSchema, cashMovementSchema, type OpenShiftValues, type CloseShiftValues, type ForceCloseValues, type CashMovementValues } from "@/entities/shift/schemas";
import { getErrorMessage } from "@/shared/api/errors";
import { fmtMoney } from "@/shared/lib/format";


export function OpenShiftDialog({ open, onClose, branchId, suggested }: { open: boolean; onClose: () => void; branchId: string; suggested: number }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<OpenShiftValues>({
    resolver: zodResolver(openShiftSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: { opening_cash: (suggested / 100) as any },
  });

  const openShift = useOpenShift({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListShiftsQueryKey(branchId) });
        qc.invalidateQueries({ queryKey: getGetCurrentShiftQueryKey(branchId) });
        toast.success(t("shifts.toasts.opened"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("shifts.openShift")}</DialogTitle>
          {suggested > 0 && <DialogDescription>{t("shifts.suggestedOpening", { amount: fmtMoney(suggested) })}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => openShift.mutate({ branchId, data: v }))}>
            <DialogBody>
              <FormField
                control={form.control}
                name="opening_cash"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("shifts.openingCash")} (EGP)</FormLabel>
                    <FormControl>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Input type="number" step="0.01" min="0" autoFocus {...(field as any)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
              <Button type="submit" loading={openShift.isPending}>{t("shifts.openShift")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CloseShiftDialog({ open, onClose, shiftId }: { open: boolean; onClose: () => void; shiftId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<CloseShiftValues>({
    resolver: zodResolver(closeShiftSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: { closing_cash_declared: 0 as any },
  });
  const closeShift = useCloseShift({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/shifts/") }); // FIX: getListShiftsQueryKey("") matched no real key — broad-invalidate all shift queries
        toast.success(t("shifts.toasts.closed"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("shifts.close")}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => closeShift.mutate({ shiftId, data: { ...v, inventory_counts: [] } }))}>
            <DialogBody>
              <FormField control={form.control} name="closing_cash_declared" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shifts.closingCashDeclared")} (EGP)</FormLabel>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <FormControl><Input type="number" step="0.01" min="0" autoFocus {...(field as any)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
              <Button type="submit" loading={closeShift.isPending}>{t("shifts.close")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function ForceCloseDialog({ open, onClose, shiftId }: { open: boolean; onClose: () => void; shiftId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<ForceCloseValues>({ resolver: zodResolver(forceCloseSchema), defaultValues: { reason: "" } });
  const forceClose = useForceCloseShift({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/shifts/") }); // FIX: getListShiftsQueryKey("") matched no real key — broad-invalidate all shift queries
        toast.success(t("shifts.toasts.forceClosed"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <ShieldAlert className="text-warning" size={18} />
            </div>
            <div>
              <DialogTitle>{t("shifts.forceClose")}</DialogTitle>
              <DialogDescription>{t("shifts.forceCloseWarning")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => forceClose.mutate({ shiftId, data: v }))}>
            <DialogBody>
              <FormField control={form.control} name="reason" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shifts.forceCloseReason")}</FormLabel>
                  <FormControl><Input placeholder={t("shifts.forceCloseReasonPh")} autoFocus {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
              <Button type="submit" variant="warning" loading={forceClose.isPending}>{t("shifts.forceClose")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function CashMovementDialog({ open, onClose, shiftId }: { open: boolean; onClose: () => void; shiftId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const form = useForm<CashMovementValues>({
    resolver: zodResolver(cashMovementSchema),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: { direction: "in", amount: 0 as any, note: "" },
  });

  const addMovement = useAddCashMovement({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("/shifts/") }); // FIX: getListShiftsQueryKey("") matched no real key — broad-invalidate all shift queries
        toast.success(t("shifts.toasts.cashRecorded"));
        onClose();
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    }
  });

  const dir = form.watch("direction");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("shifts.cashDialog.title")}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => {
            const amount = v.direction === "out" ? -v.amount : v.amount;
            addMovement.mutate({ shiftId, data: { amount, note: v.note } });
          })}>
            <DialogBody>
              <FormField control={form.control} name="direction" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("shifts.cashDialog.direction")}</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => field.onChange("in")}
                      className={`rounded-lg border p-3 text-start transition-colors ${dir === "in" ? "border-success bg-success/5" : "border-input hover:bg-muted"}`}
                    >
                      <ArrowDownCircle className={dir === "in" ? "text-success" : "text-muted-foreground"} size={16} />
                      <p className="text-sm font-semibold mt-1">{t("shifts.cashDialog.in")}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("out")}
                      className={`rounded-lg border p-3 text-start transition-colors ${dir === "out" ? "border-destructive bg-destructive/5" : "border-input hover:bg-muted"}`}
                    >
                      <ArrowUpCircle className={dir === "out" ? "text-destructive" : "text-muted-foreground"} size={16} />
                      <p className="text-sm font-semibold mt-1">{t("shifts.cashDialog.out")}</p>
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.amount")} (EGP)</FormLabel>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <FormControl><Input type="number" step="0.01" min="0.01" autoFocus {...(field as any)} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="note" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.notes")}</FormLabel>
                  <FormControl><Input placeholder={t("shifts.cashDialog.notePh")} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
              <Button type="submit" loading={addMovement.isPending}>{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

