/**
 * The three shapes every setting on this screen takes.
 *
 * A labelled switch with an explanation under it appeared seven times inline in
 * the old form, each spelled slightly differently — one had a bold label, one
 * did not, two forgot `shouldDirty` so saving skipped them. They are one
 * component now, which is also the only way the screen reads as one screen.
 */
import type { ReactNode } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** A titled block of related settings. */
export function Group({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      {title ? (
        <div className="space-y-1">
          <p className="text-sm font-bold">{title}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

/** A switch, its name, and why you would want it. */
export function ToggleRow<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  subdued,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  /** A secondary option inside a group, rather than a setting in its own right. */
  subdued?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className={subdued ? "text-xs text-muted-foreground" : "text-sm font-bold"}>
          {label}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch
        checked={Boolean(form.watch(name))}
        // `shouldDirty` on every one of them: a switch that does not mark the
        // form dirty is a setting that silently does not save.
        onCheckedChange={(v) =>
          form.setValue(name, v as never, { shouldDirty: true })
        }
      />
    </div>
  );
}

/** A labelled input with an optional explanation. */
export function TextRow<T extends FieldValues>({
  form,
  name,
  label,
  hint,
  placeholder,
  type,
  dir,
  mono,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: ReactNode;
  hint?: ReactNode;
  placeholder?: string;
  type?: "text" | "number";
  dir?: "rtl";
  mono?: boolean;
}) {
  const id = String(name);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        step={type === "number" ? "any" : undefined}
        dir={dir}
        placeholder={placeholder}
        className={mono ? "font-mono" : undefined}
        {...form.register(name)}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
