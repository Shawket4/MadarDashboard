import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical, Tag } from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { AssetImage, assetOf } from "@/components/app/asset-image";
import { EmptyState } from "@/components/app/empty-state";
import { useReorderCategories } from "@/data/api/generated/api";
import type { Category } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { getTranslatedName } from "@/lib/translation";
import { invalidateCatalog } from "./util";

interface Props {
  orgId: string;
  categories: Category[];
  isLoading?: boolean;
}

/**
 * Drag-and-drop category ordering. Optimistic: the list reorders instantly,
 * `PUT /categories/order` persists it, and a failed save rolls the list back
 * to the server's last-known order and surfaces a toast. Up/down buttons give
 * keyboard and screen-reader users the same reordering without a drag
 * gesture; the drag handle itself is also keyboard-operable (dnd-kit's
 * keyboard sensor — Space to pick up, arrow keys to move, Space to drop).
 */
export function CategoryReorderList({ orgId, categories, isLoading }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [order, setOrder] = useState<Category[]>(categories);

  // Follow the server list whenever it changes from elsewhere (e.g. a
  // category created/deleted on another tab), but not while we have an
  // in-flight save of our own — that would fight the optimistic update.
  const reorder = useReorderCategories({
    mutation: {
      onError: (e) => {
        setOrder(categories);
        toast.error(getErrorMessage(e));
      },
      onSuccess: () => {
        toast.success(t("common.savedChanges", "Changes saved"));
        void invalidateCatalog();
      },
    },
  });
  useEffect(() => {
    if (!reorder.isPending) setOrder(categories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const commit = (next: Category[]) => {
    setOrder(next);
    reorder.mutate({ data: { org_id: orgId, ordered_ids: next.map((c) => c.id) } });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    commit(arrayMove(order, from, to));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.findIndex((c) => c.id === active.id);
    const to = order.findIndex((c) => c.id === over.id);
    if (from === -1 || to === -1) return;
    commit(arrayMove(order, from, to));
  };

  if (isLoading) return null;
  if (order.length === 0) {
    return <EmptyState icon={Tag} title={t("menu.noCategories", "No categories yet")} />;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        {t("menu.categoriesReorderHint", "Drag to reorder — this is the order the POS shows categories in.")}
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {order.map((c, idx) => (
              <SortableCategoryRow
                key={c.id}
                category={c}
                index={idx}
                count={order.length}
                name={getTranslatedName(c, lang)}
                onMoveUp={() => move(idx, idx - 1)}
                onMoveDown={() => move(idx, idx + 1)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableCategoryRow({
  category, index, count, name, onMoveUp, onMoveDown,
}: {
  category: Category;
  index: number;
  count: number;
  name: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border bg-card p-2.5 ${isDragging ? "z-10 opacity-70 shadow-lg" : ""}`}
    >
      <button
        type="button"
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground/60 hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={t("menu.categoriesDragToReorder", { name, defaultValue: `Drag "${name}" to reorder` })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
        {assetOf(category) || category.image_url ? (
          <AssetImage asset={assetOf(category)} legacyUrl={category.image_url} sizes="64px" className="size-full object-cover" />
        ) : (
          <Tag className="size-4" aria-hidden />
        )}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          type="button" variant="ghost" size="icon" className="size-8"
          disabled={index === 0} onClick={onMoveUp}
          aria-label={t("menu.studio.steps.moveUp", "Move up")}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button" variant="ghost" size="icon" className="size-8"
          disabled={index === count - 1} onClick={onMoveDown}
          aria-label={t("menu.studio.steps.moveDown", "Move down")}
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
    </li>
  );
}
