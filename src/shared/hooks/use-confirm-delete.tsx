import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

/**
 * Standard confirm-before-delete pattern: hold the pending target in state,
 * render one ConfirmDialog, call the handler on confirm.
 *
 *   const del = useConfirmDelete<Branch>((b) => remove.mutate(b.id), { name: (b) => b.name });
 *   …
 *   <RowActions onDelete={() => del.request(row.original)} />
 *   {del.dialog}
 */
export function useConfirmDelete<T>(
  onConfirm: (target: T) => void,
  options: { name: (target: T) => string; loading?: boolean },
) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<T | null>(null);

  const dialog = (
    <ConfirmDialog
      open={!!target}
      onOpenChange={(o) => !o && setTarget(null)}
      title={t("common.confirmDelete", { name: target ? options.name(target) : "" })}
      destructive
      loading={options.loading}
      onConfirm={() => {
        if (target) onConfirm(target);
      }}
    />
  );

  return {
    request: (t2: T) => setTarget(t2),
    /** Call from the mutation's onSuccess to dismiss. */
    close: () => setTarget(null),
    target,
    dialog,
  };
}
