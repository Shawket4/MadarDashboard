import * as React from "react";
import { useTranslation } from "react-i18next";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import {
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "./dialog";
import { Form } from "./form";
import { Button } from "./button";

export interface FormDialogProps<T extends FieldValues> {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  form: UseFormReturn<T>;
  /** Receives the validated values — wire your mutation here. */
  onSubmit: (values: T) => void;
  isPending?: boolean;
  submitLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Rendered start-aligned in the footer (e.g. a delete button). */
  footerExtra?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * The standard create/edit dialog scaffold — Dialog + react-hook-form wiring +
 * cancel/submit footer with a loading submit button. Every entity dialog in
 * the app composes this instead of re-declaring the skeleton.
 */
export function FormDialog<T extends FieldValues>({
  open,
  onClose,
  title,
  description,
  form,
  onSubmit,
  isPending,
  submitLabel,
  cancelLabel,
  size = "md",
  footerExtra,
  children,
}: FormDialogProps<T>) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>{children}</DialogBody>
            <DialogFooter className={footerExtra ? "sm:justify-between" : undefined}>
              {footerExtra && <div className="flex items-center gap-2">{footerExtra}</div>}
              <div className="flex items-center gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onClose}>
                  {cancelLabel ?? t("common.cancel")}
                </Button>
                <Button type="submit" loading={isPending}>
                  {submitLabel ?? t("common.save")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
