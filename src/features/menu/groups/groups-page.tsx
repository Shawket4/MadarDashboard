import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical, Layers, Pencil, Plus, Store, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Page, PageHeader } from "@/components/app/page";
import { EmptyState } from "@/components/app/empty-state";
import { useConfirm } from "@/components/app/confirm-dialog";
import { deleteGroup, patchGroup, useListGroups } from "@/data/api/generated/api";
import type { GroupOut } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import { useOrgId } from "@/hooks/use-org-id";
import { Cap } from "@/generated/capabilities";
import { useCan } from "@/data/authz/use-authz";

import { cn } from "@/lib/utils";
import { arOf, invalidateCatalog } from "../util";
import { GroupEditorDialog } from "./group-editor-dialog";
import { GroupUsageDialog } from "./group-usage-dialog";
import { isSwapType, selectionToPickRule, SWAP_TYPES } from "./group-model";
import { useGroupUsage } from "./use-group-usage";

/** The item-private "Options" sets are groups with no legacy type; they are
 * edited in each item's editor, not here. */
const isSharedGroup = (g: GroupOut) => g.legacy_addon_type != null;

/**
 * Choice groups (MENU_MODELING_AUDIT §6 Phase 1): every reusable group with its
 * pick rule, what choosing does, option count and where it's used. Rows reorder
 * by drag or the arrows; `?edit=<id>|new` opens the editor so the Menu Studio
 * can deep-link "Edit group".
 */
export function GroupsPage() {
  const { t } = useTranslation();
  const orgId = useOrgId();
  const confirm = useConfirm();
  const canEdit = useCan(Cap.menuItemsEdit);
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { edit?: string };

  const groupsQ = useListGroups({ org_id: orgId ?? "" }, { query: { enabled: !!orgId } });
  const groups = useMemo(
    () => (groupsQ.data ?? []).filter(isSharedGroup).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name)),
    [groupsQ.data],
  );
  const usage = useGroupUsage(orgId);

  const [order, setOrder] = useState<GroupOut[]>(groups);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!saving) setOrder(groups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const [managing, setManaging] = useState<GroupOut | null>(null);

  const setEdit = (edit: string | undefined) =>
    void navigate({ to: ".", replace: true, search: (prev: Record<string, unknown>) => ({ ...prev, edit }) });
  const editing = search.edit && search.edit !== "new" ? (groups.find((g) => g.id === search.edit) ?? null) : null;
  const editorOpen = (search.edit === "new" && canEdit) || !!editing;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** Persist the new order: patch `sort` on every group whose position moved. */
  const commit = async (next: GroupOut[]) => {
    setOrder(next);
    setSaving(true);
    try {
      for (const [i, g] of next.entries()) {
        if (g.sort !== i) await patchGroup(g.id, { sort: i });
      }
      toast.success(t("common.savedChanges", "Changes saved"));
    } catch (e) {
      setOrder(groups);
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
      void groupsQ.refetch();
      void invalidateCatalog();
    }
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    void commit(arrayMove(order, from, to));
  };
  const onDragEnd = (e: DragEndEvent) => {
    const from = order.findIndex((g) => g.id === e.active.id);
    const to = order.findIndex((g) => g.id === e.over?.id);
    if (from === -1 || to === -1 || from === to) return;
    void commit(arrayMove(order, from, to));
  };

  const remove = async (g: GroupOut) => {
    const ok = await confirm({
      title: t("menu.groups.deleteTitle", { name: g.name, defaultValue: "Delete {{name}}?" }),
      description: t(
        "menu.groups.deleteConsequence",
        "If items still offer it or orders used it, it is switched off instead, so history stays intact.",
      ),
      confirmLabel: t("common.delete", "Delete"),
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteGroup(g.id);
      toast.success(t("common.savedChanges", "Changes saved"));
      void groupsQ.refetch();
      void invalidateCatalog();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (!orgId) {
    return (
      <Page>
        <EmptyState icon={Store} title={t("menu.pickOrg", "Select an organization to manage its menu")} />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        title={t("menu.groups.title", "Choice groups")}
        subtitle={t("menu.groups.subtitle", "Milk, beans, flavours, extras: the choices the cashier offers on items.")}
        actions={
          canEdit ? (
            <Button onClick={() => setEdit("new")}>
              <Plus className="size-4" /> {t("menu.groups.new", "New group")}
            </Button>
          ) : null
        }
      />

      {groupsQ.isLoading ? null : order.length === 0 ? (
        <EmptyState icon={Layers} title={t("menu.groups.empty", "No choice groups yet")} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={order.map((g) => g.id)} strategy={verticalListSortingStrategy}>
            <ol className="space-y-2" aria-busy={saving}>
              {order.map((g, idx) => (
                <GroupRow
                  key={g.id}
                  group={g}
                  index={idx}
                  count={order.length}
                  usedOn={usage.ready ? (usage.byGroup.get(g.id)?.length ?? 0) : null}
                  disabled={saving}
                  canEdit={canEdit}
                  onMoveUp={() => move(idx, idx - 1)}
                  onMoveDown={() => move(idx, idx + 1)}
                  onEdit={() => setEdit(g.id)}
                  onManage={() => setManaging(g)}
                  onDelete={() => void remove(g)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      {editorOpen ? (
        <GroupEditorDialog
          orgId={orgId}
          group={editing}
          open={editorOpen}
          onOpenChange={(o) => {
            if (!o) setEdit(undefined);
          }}
          usedOn={editing && usage.ready ? (usage.byGroup.get(editing.id)?.length ?? 0) : null}
          onManageItems={editing ? () => setManaging(editing) : undefined}
          onSaved={() => void groupsQ.refetch()}
          readOnly={!canEdit}
        />
      ) : null}
      {managing ? (
        <GroupUsageDialog
          orgId={orgId}
          group={managing}
          uses={usage.byGroup.get(managing.id) ?? []}
          readOnly={!canEdit}
          open={!!managing}
          onOpenChange={(o) => {
            if (!o) setManaging(null);
          }}
        />
      ) : null}
    </Page>
  );
}

function GroupRow({
  group,
  index,
  count,
  usedOn,
  disabled,
  canEdit,
  onMoveUp,
  onMoveDown,
  onEdit,
  onManage,
  onDelete,
}: {
  group: GroupOut;
  index: number;
  count: number;
  usedOn: number | null;
  disabled: boolean;
  canEdit: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onManage: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id, disabled: !canEdit });
  const ar = arOf(group.name_translations);
  const rule = selectionToPickRule(group);
  const pickLabel =
    rule.kind === "exactly_one"
      ? t("menu.groups.pick.exactlyOneShort", "Pick exactly 1")
      : rule.kind === "up_to"
        ? t("menu.groups.pick.upToShort", { count: rule.max, defaultValue: "Pick up to {{count}}" })
        : t("menu.groups.pick.anyShort", "Pick any number");
  const effectLabel =
    group.legacy_addon_type === SWAP_TYPES.milk
      ? t("menu.groups.effect.swapsMilk", "Swaps the drink's milk")
      : group.legacy_addon_type === SWAP_TYPES.beans
        ? t("menu.groups.effect.swapsBeans", "Swaps the drink's beans")
        : t("menu.groups.effect.addsOrNothing", "Adds ingredients or nothing");

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-wrap items-center gap-3 rounded-lg border bg-card p-2.5", isDragging && "z-10 opacity-70 shadow-lg")}
    >
      {canEdit ? (
      <button
        type="button"
        className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground/60 hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={t("menu.groups.dragToReorder", { name: group.name, defaultValue: "Drag {{name}} to reorder" })}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      ) : null}

      <button type="button" onClick={onEdit} className="min-w-40 flex-1 text-start">
        <span className="block truncate text-sm font-medium">{group.name}</span>
        {ar ? (
          <span dir="rtl" className="block truncate text-xs text-muted-foreground">
            {ar}
          </span>
        ) : null}
      </button>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="font-normal">
          {pickLabel}
        </Badge>
        <Badge variant={isSwapType(group.legacy_addon_type) ? "default" : "secondary"} className="font-normal">
          {effectLabel}
        </Badge>
        <Badge variant="secondary" className="font-normal tabular">
          {t("menu.groups.optionCount", { count: group.options.length, defaultValue: "{{count}} options" })}
        </Badge>
        {!group.is_active ? (
          <Badge variant="outline" className="font-normal">
            {t("common.inactive", "Inactive")}
          </Badge>
        ) : null}
      </div>

      <Button type="button" variant="link" size="sm" className="h-auto px-1" onClick={onManage} disabled={usedOn == null}>
        {usedOn == null ? "…" : t("menu.groups.usedOn", { count: usedOn, defaultValue: "Used on {{count}} items" })}
      </Button>

      <div className="flex shrink-0 items-center gap-0.5">
        {canEdit ? (
          <>
        <Button type="button" variant="ghost" size="icon" className="size-8" disabled={disabled || index === 0} onClick={onMoveUp} aria-label={t("menu.studio.steps.moveUp", "Move up")}>
          <ArrowUp className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" disabled={disabled || index === count - 1} onClick={onMoveDown} aria-label={t("menu.studio.steps.moveDown", "Move down")}>
          <ArrowDown className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onEdit} aria-label={t("common.edit", "Edit")}>
          <Pencil className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="size-8 text-destructive" onClick={onDelete} aria-label={t("common.delete", "Delete")}>
          <Trash2 className="size-4" />
        </Button>
          </>
        ) : null}
      </div>
    </li>
  );
}
