import * as React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "./button";

/**
 * End-aligned per-row action buttons for tables. Stops click propagation so
 * row-click handlers don't fire underneath.
 */
export function RowActions({
  onEdit,
  onDelete,
  editTitle,
  deleteTitle,
  children,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editTitle?: string;
  deleteTitle?: string;
  /** Extra action buttons rendered before edit/delete. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
      {children}
      {onEdit && (
        <Button variant="ghost" size="iconSm" title={editTitle} onClick={onEdit}>
          <Edit2 size={13} />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="iconSm" className="text-destructive" title={deleteTitle} onClick={onDelete}>
          <Trash2 size={13} />
        </Button>
      )}
    </div>
  );
}
