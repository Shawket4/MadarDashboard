/**
 * The branch builder: the owner draws the branch — its POS devices, printers,
 * kitchen screens and sections — and how they talk (kitchen target spec BB-*).
 *
 * Laid out like the floor, on purpose: one canvas in a card, an edit toolbar
 * that appears when unlocked, and an inspector docked beside it. The branch is
 * never "set up once": it can be reopened and changed at any time (CH-1), which
 * is why edits collect in a draft with undo and are reviewed before they apply
 * rather than autosaved (see `use-plan-draft.ts`).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  ChevronDown, CircleDot, History, Lock, LockOpen, Maximize2, Minus, Network, Plus, Redo2, Trash2,
  TriangleAlert, Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState, ErrorState } from "@/components/app/empty-state";
import { Page, PageHeader } from "@/components/app/page";
import { getErrorMessage } from "@/data/api/errors";
import { useScope } from "@/data/scope/use-scope";
import { fmtStamp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFloorViewport } from "@/features/floor/use-floor-viewport";
import { ZOOM_STEP } from "@/features/floor/util";

import {
  EMPTY_PLAN, NODE_H, NODE_W, addLink, boxesOf, checkPlan, linksOf, movePieces, pieceKey,
  planForSetup, removeLink, removePieces, type DeviceKind, type PieceRef, type PlanLink,
  type PrinterRole, type Setup,
} from "./plan";
import {
  fromWire, presenceOf, refusalCode, reloadBranchPlan, saveBranchPlan, useBranchPlan, usePlanVersions,
} from "./api";
import { BuilderCanvas, LINK_STYLE, type PieceView } from "./builder-canvas";
import { ReviewDialog, SetupPicker } from "./dialogs";
import { Inspector } from "./inspector";
import { usePlanDraft } from "./use-plan-draft";
import {
  DEVICE_ICON, PRINTER_ICON, SECTION_ICON, connectionLabel, deviceKindLabel, linkLabel, printerRoleLabel,
} from "./vocabulary";

type NewPiece = { device: DeviceKind } | { printer: PrinterRole } | { section: true };

const newId = () => crypto.randomUUID();

export function BranchBuilderPage() {
  const { t } = useTranslation();
  const scope = useScope();
  const branchId = scope.branchId ?? null;

  const q = useBranchPlan(branchId);
  const view = q.data;
  const saved = useMemo(() => (view ? fromWire(view.plan) : null), [view]);
  const draft = usePlanDraft(saved, view?.version ?? null);
  const plan = draft.plan ?? EMPTY_PLAN;

  const [editable, setEditable] = useState(false);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [selectedLink, setSelectedLink] = useState<PlanLink | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const versionsQ = usePlanVersions(branchId, historyOpen);

  const viewport = useFloorViewport();
  const { fitTo, attach } = viewport;

  // A new branch, or another branch picked in the top bar: start clean.
  useEffect(() => {
    setSelection(new Set());
    setSelectedLink(null);
    setEditable(false);
  }, [branchId]);

  const problems = useMemo(() => checkPlan(plan), [plan]);
  const blocking = problems.filter((p) => p.blocking).length;

  const registered = useMemo(() => new Map((view?.devices ?? []).map((d) => [d.id, d])), [view]);
  const openItems = useMemo(() => new Map((view?.open_items ?? []).map((c) => [c.section_id, c.count])), [view]);
  const itemOverrides = useMemo(() => new Map((view?.item_overrides ?? []).map((c) => [c.section_id, c.count])), [view]);
  const savedSlots = useMemo(() => new Set(saved?.devices.map((d) => d.id) ?? []), [saved]);

  // "Seen 4 min ago" ages by the clock, not by a refetch.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── The cards ─────────────────────────────────────────────────────────────

  const pieces: PieceView[] = useMemo(() => {
    const boxes = new Map(boxesOf(plan).map((b) => [b.key, b]));
    const problemOf = (key: string): PieceView["problem"] => {
      const mine = problems.filter((p) => p.piece && pieceKey(p.piece) === key);
      if (mine.some((p) => p.blocking)) return "blocking";
      return mine.length ? "warning" : null;
    };
    const out: PieceView[] = [];
    for (const d of plan.devices) {
      const key = pieceKey({ kind: "device", id: d.id });
      const { presence, seen } = presenceOf(d.device_id, registered, now);
      const shows = plan.sections.filter((s) => s.screen_ids.includes(d.id)).map((s) => s.name);
      out.push({
        key,
        box: boxes.get(key)!,
        icon: DEVICE_ICON[d.kind],
        title: d.name || t("builder.unnamed", "Unnamed"),
        subtitle:
          d.kind === "kitchen" && shows.length ? shows.join(" · ") : deviceKindLabel(t, d.kind),
        presence: {
          tone: presence,
          label:
            presence === "unclaimed"
              ? t("builder.notSetUpShort", "Not set up")
              : presence === "online"
                ? t("builder.online", "Online")
                : t("builder.seenAt", "Seen {{when}}", { when: fmtStamp(seen?.last_seen_at) }),
        },
        placeholder: presence === "unclaimed",
        problem: problemOf(key),
      });
    }
    for (const p of plan.printers) {
      const key = pieceKey({ kind: "printer", id: p.id });
      const host = plan.devices.find((d) => d.id === p.host_device_id);
      const where =
        p.connection === "network"
          ? p.ip || t("builder.noAddress", "No IP address")
          : host
            ? `${connectionLabel(t, p.connection)} · ${host.name}`
            : connectionLabel(t, p.connection);
      out.push({
        key,
        box: boxes.get(key)!,
        icon: PRINTER_ICON[p.role],
        title: p.name || t("builder.unnamed", "Unnamed"),
        subtitle: printerRoleLabel(t, p.role),
        detail: where,
        placeholder: false,
        problem: problemOf(key),
      });
    }
    for (const s of plan.sections) {
      const key = pieceKey({ kind: "section", id: s.id });
      const cooking = openItems.get(s.id) ?? 0;
      out.push({
        key,
        box: boxes.get(key)!,
        icon: SECTION_ICON,
        title: s.name || t("builder.unnamed", "Unnamed"),
        badge: s.is_default ? t("builder.defaultBadge", "Everything else") : undefined,
        subtitle: t("builder.categoriesCount", "{{count}} categories", { count: s.category_ids.length }),
        detail: cooking > 0 ? t("builder.cookingCount", "{{count}} cooking now", { count: cooking }) : undefined,
        placeholder: false,
        problem: problemOf(key),
      });
    }
    return out;
  }, [plan, problems, registered, openItems, now, t]);

  // Frame the branch once it is known, and again when another is picked.
  const framedFor = useRef<string | null>(null);
  const frame = useCallback(() => {
    const boxes = boxesOf(plan);
    if (boxes.length) fitTo(boxes.map((b) => ({ id: b.key, x: b.x, y: b.y, w: b.w, h: b.h, rot: 0 })));
  }, [plan, fitTo]);
  useEffect(() => {
    if (!branchId || !draft.plan) return;
    const key = `${branchId}:${draft.plan.devices.length + draft.plan.printers.length + draft.plan.sections.length > 0}`;
    if (framedFor.current === key) return;
    framedFor.current = key;
    frame();
  }, [branchId, draft.plan, frame]);

  // ── Edits ─────────────────────────────────────────────────────────────────

  const select = useCallback((ref: PieceRef | null) => {
    setSelectedLink(null);
    setSelection(ref ? new Set([pieceKey(ref)]) : new Set());
  }, []);

  /** Somewhere free near the middle of the view, so a new piece lands in sight. */
  const freeSpot = useCallback(
    (h: number) => {
      const boxes = boxesOf(plan);
      const x = Math.round((viewport.view.x + viewport.rect.w / 2 - NODE_W / 2) / 10) * 10;
      let y = Math.round((viewport.view.y + viewport.rect.h / 2 - h / 2) / 10) * 10;
      const overlaps = (yy: number) => boxes.some((b) => x < b.x + b.w && x + NODE_W > b.x && yy < b.y + b.h && yy + h > b.y);
      for (let i = 0; i < 40 && overlaps(y); i++) y += 20;
      return { x, y };
    },
    [plan, viewport.view.x, viewport.view.y, viewport.rect.w, viewport.rect.h],
  );

  const addPiece = useCallback(
    (what: NewPiece) => {
      const id = newId();
      const numbered = (base: string, n: number) => `${base} ${n}`;
      if ("device" in what) {
        const kind = what.device;
        const n = plan.devices.filter((d) => d.kind === kind).length + 1;
        const at = freeSpot(NODE_H);
        draft.change((p) => ({
          ...p,
          devices: [...p.devices, { id, kind, name: numbered(deviceKindLabel(t, kind), n), receipt_printer_id: null, device_id: null, ...at }],
        }));
        select({ kind: "device", id });
      } else if ("printer" in what) {
        const role = what.printer;
        const n = plan.printers.filter((p) => p.role === role).length + 1;
        const at = freeSpot(NODE_H);
        draft.change((p) => ({
          ...p,
          printers: [
            ...p.printers,
            {
              id, role, name: numbered(printerRoleLabel(t, role), n), connection: "network", brand: null, ip: null, port: 9100,
              paper_mm: 80, host_device_id: null, ...at,
            },
          ],
        }));
        select({ kind: "printer", id });
      } else {
        const n = plan.sections.length + 1;
        const at = freeSpot(104);
        draft.change((p) => ({
          ...p,
          sections: [
            ...p.sections,
            {
              id, name: numbered(t("builder.kind.section", "Kitchen section"), n), is_default: p.sections.length === 0,
              category_ids: [], screen_ids: [], printer_ids: [], ...at,
            },
          ],
        }));
        select({ kind: "section", id });
      }
    },
    [draft, freeSpot, plan, select, t],
  );

  const remove = useCallback(
    (keys: Set<string>) => {
      if (!editable || keys.size === 0) return;
      draft.change((p) => removePieces(p, keys));
      setSelection(new Set());
    },
    [draft, editable],
  );

  const pickSetup = useCallback(
    (setup: Setup) => {
      const categories = (view?.categories ?? []).map((c) => c.id);
      const names = {
        till: `${deviceKindLabel(t, "pos")} 1`,
        receiptPrinter: printerRoleLabel(t, "receipt"),
        kitchen: t("builder.names.kitchen", "Kitchen"),
        kitchenPrinter: printerRoleLabel(t, "kitchen"),
        kitchenScreen: deviceKindLabel(t, "kitchen"),
        sectionA: t("builder.names.hot", "Hot"),
        sectionB: t("builder.names.cold", "Cold"),
        screenA: t("builder.names.hotScreen", "Hot screen"),
        screenB: t("builder.names.coldScreen", "Cold screen"),
      };
      draft.replace(planForSetup(setup, names, categories, newId));
      setEditable(true);
      framedFor.current = null;
    },
    [draft, t, view?.categories],
  );

  // ── Saving ────────────────────────────────────────────────────────────────

  const save = useCallback(async () => {
    if (!branchId || draft.baseVersion === null) return;
    setSaving(true);
    try {
      const next = await saveBranchPlan(branchId, draft.baseVersion, plan);
      draft.adopt(fromWire(next.plan), next.version);
      setReviewing(false);
      toast.success(t("builder.saved", "Branch plan saved"));
    } catch (err) {
      const code = refusalCode(err);
      if (code === "PLAN_CHANGED") {
        setReviewing(false);
        toast.error(getErrorMessage(err), {
          duration: 12_000,
          action: {
            label: t("builder.reloadTheirs", "Load their version"),
            onClick: () => {
              draft.discard();
              void reloadBranchPlan(branchId);
            },
          },
        });
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setSaving(false);
    }
  }, [branchId, draft, plan, t]);

  // An unsaved plan must not vanish with a closing tab.
  useEffect(() => {
    if (!draft.dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft.dirty]);

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=dialog], [role=menu]")) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "e") { e.preventDefault(); setEditable((v) => !v); return; }
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (!editable) return;
        if (e.shiftKey) draft.redo(); else draft.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); if (editable) draft.redo(); return; }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); if (draft.dirty && blocking === 0) setReviewing(true); return; }
      if (e.key === "+" || e.key === "=") { e.preventDefault(); viewport.zoomBy(ZOOM_STEP); return; }
      if (e.key === "-" || e.key === "_") { e.preventDefault(); viewport.zoomBy(1 / ZOOM_STEP); return; }
      if (e.key === "0") { e.preventDefault(); frame(); return; }
      if (e.key === "Escape") { setSelection(new Set()); setSelectedLink(null); return; }
      if (!editable) return;

      const arrows: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      };
      const delta = arrows[e.key];
      if (delta && selection.size) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 10;
        const moves = new Map<string, { x: number; y: number }>();
        for (const b of boxesOf(plan)) {
          if (selection.has(b.key)) moves.set(b.key, { x: b.x + delta[0] * step, y: b.y + delta[1] * step });
        }
        draft.change((p) => movePieces(p, moves));
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedLink) {
          draft.change((p) => removeLink(p, selectedLink));
          setSelectedLink(null);
        } else {
          remove(selection);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocking, draft, editable, frame, plan, remove, selectedLink, selection, viewport]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!branchId) {
    return (
      <Page>
        <PageHeader title={t("builder.title", "Branch setup")} />
        <EmptyState icon={Network} title={t("builder.pickBranch", "Select a branch in the top bar to set it up")} />
      </Page>
    );
  }

  const empty = !!draft.plan && pieces.length === 0;
  const counts = {
    devices: plan.devices.length,
    printers: plan.printers.length,
    sections: plan.sections.length,
  };

  return (
    <Page className="flex min-h-0 flex-1 flex-col gap-4 space-y-0 pb-4 lg:pb-6">
      <PageHeader
        title={t("builder.title", "Branch setup")}
        description={t("builder.subtitle", "Every device, printer and kitchen section in this branch, and how orders travel between them.")}
        actions={
          <div className="flex flex-wrap items-center gap-1">
            {draft.dirty ? (
              <span role="status" className="me-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CircleDot className="size-3 text-primary" />
                {t("builder.unsaved", "Unsaved changes")}
              </span>
            ) : null}
            <IconButton label={t("floor.zoomOut", "Zoom out")} onClick={() => viewport.zoomBy(1 / ZOOM_STEP)}>
              <Minus className="size-4" />
            </IconButton>
            <IconButton label={t("floor.fit", "Fit to content")} onClick={frame}>
              <Maximize2 className="size-4" />
            </IconButton>
            <IconButton label={t("floor.zoomIn", "Zoom in")} onClick={() => viewport.zoomBy(ZOOM_STEP)}>
              <Plus className="size-4" />
            </IconButton>

            <DropdownMenu onOpenChange={setHistoryOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1.5" disabled={!view?.saved}>
                  <History className="size-4" />
                  <span className="hidden sm:inline">{t("builder.history", "History")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                  {t("builder.historyHint", "Load an earlier plan into the editor. Nothing changes until you save it.")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(versionsQ.data ?? []).map((v) => (
                  <DropdownMenuItem
                    key={v.version}
                    disabled={v.version === view?.version}
                    onSelect={() => {
                      const earlier = fromWire(v.plan);
                      // A device retired since can't fill a place again.
                      draft.replace({
                        ...earlier,
                        devices: earlier.devices.map((d) => (d.device_id && !registered.has(d.device_id) ? { ...d, device_id: null } : d)),
                      });
                      setEditable(true);
                    }}
                    className="flex flex-col items-start gap-0.5"
                  >
                    <span className="text-sm">
                      {t("builder.versionN", "Version {{n}}", { n: v.version })}
                      {v.version === view?.version ? ` · ${t("builder.current", "current")}` : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtStamp(v.saved_at)}
                      {v.saved_by_name ? ` · ${v.saved_by_name}` : ""}
                    </span>
                  </DropdownMenuItem>
                ))}
                {versionsQ.isLoading ? (
                  <DropdownMenuItem disabled>{t("common.loading", "Loading…")}</DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={editable ? "default" : "outline"}
              className="ms-1 gap-1.5"
              onClick={() => setEditable((v) => !v)}
              aria-pressed={editable}
            >
              {editable ? <LockOpen className="size-4" /> : <Lock className="size-4" />}
              {editable ? t("floor.editing", "Editing") : t("floor.locked", "Locked")}
            </Button>
            {draft.dirty ? (
              <>
                <Button variant="ghost" onClick={draft.discard} disabled={saving}>
                  {t("builder.discard", "Discard")}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* A span keeps the tooltip reachable while the button is disabled. */}
                    <span tabIndex={blocking ? 0 : -1}>
                      <Button onClick={() => setReviewing(true)} disabled={blocking > 0 || saving}>
                        {t("builder.saveEllipsis", "Save…")}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {blocking ? (
                    <TooltipContent>
                      {t("builder.fixFirst", "Fix the problems marked in red first")}
                    </TooltipContent>
                  ) : null}
                </Tooltip>
              </>
            ) : null}
          </div>
        }
      />

      {draft.overtaken ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm">
          <TriangleAlert className="size-4 shrink-0 text-[color-mix(in_oklab,var(--color-warning)_55%,var(--color-foreground))]" />
          <span className="min-w-0 flex-1">
            {t("builder.overtaken", "Someone saved this branch's plan while you were editing. Saving now would be refused.")}
          </span>
          <Button size="sm" variant="outline" onClick={draft.discard}>
            {t("builder.reloadTheirs", "Load their version")}
          </Button>
        </div>
      ) : null}

      <div className="flex min-h-[60svh] flex-1 flex-col overflow-hidden rounded-2xl border bg-card">
        {editable && !empty ? (
          <div className="flex flex-wrap items-center gap-1 border-b bg-secondary/50 px-2 py-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-1.5">
                  <Plus className="size-3.5" />
                  {t("builder.add", "Add")}
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel className="text-xs text-muted-foreground">{t("builder.frontOfHouse", "Front of house")}</DropdownMenuLabel>
                {(["pos", "waiter"] as const).map((k) => (
                  <AddItem key={k} icon={DEVICE_ICON[k]} label={deviceKindLabel(t, k)} onSelect={() => addPiece({ device: k })} />
                ))}
                <AddItem icon={PRINTER_ICON.receipt} label={printerRoleLabel(t, "receipt")} onSelect={() => addPiece({ printer: "receipt" })} />
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">{t("builder.kitchenSide", "Kitchen")}</DropdownMenuLabel>
                <AddItem icon={SECTION_ICON} label={t("builder.kind.section", "Kitchen section")} onSelect={() => addPiece({ section: true })} />
                <AddItem icon={DEVICE_ICON.kitchen} label={deviceKindLabel(t, "kitchen")} onSelect={() => addPiece({ device: "kitchen" })} />
                <AddItem icon={PRINTER_ICON.kitchen} label={printerRoleLabel(t, "kitchen")} onSelect={() => addPiece({ printer: "kitchen" })} />
              </DropdownMenuContent>
            </DropdownMenu>
            <Divider />
            <IconButton label={t("floor.undo", "Undo")} onClick={draft.undo} disabled={!draft.canUndo}>
              <Undo2 className="size-4" />
            </IconButton>
            <IconButton label={t("floor.redo", "Redo")} onClick={draft.redo} disabled={!draft.canRedo}>
              <Redo2 className="size-4" />
            </IconButton>
            <Divider />
            <IconButton
              label={t("builder.removePiece", "Remove from the plan")}
              onClick={() => {
                if (selectedLink) {
                  draft.change((p) => removeLink(p, selectedLink));
                  setSelectedLink(null);
                } else remove(selection);
              }}
              disabled={selection.size === 0 && !selectedLink}
            >
              <Trash2 className="size-4" />
            </IconButton>
            <span className="ms-auto hidden pe-2 text-xs text-muted-foreground lg:inline">
              {t("builder.hint", "Drag a card to move it · drag from its dot to another card to connect them · ⌘S to save")}
            </span>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <div className="relative min-h-[45svh] flex-1 xl:min-h-0" ref={attach}>
            {q.isLoading ? (
              <Skeleton className="absolute inset-3" />
            ) : q.isError ? (
              <div className="grid h-full place-items-center p-6">
                <ErrorState message={getErrorMessage(q.error)} onRetry={() => void q.refetch()} retrying={q.isFetching} />
              </div>
            ) : empty ? (
              <div className="grid h-full place-items-center overflow-y-auto">
                <SetupPicker onPick={pickSetup} />
              </div>
            ) : (
              <BuilderCanvas
                plan={plan}
                pieces={pieces}
                editable={editable}
                viewport={viewport}
                selection={selection}
                onSelectionChange={(s) => {
                  setSelection(s);
                  if (s.size) setSelectedLink(null);
                }}
                selectedLink={selectedLink}
                onSelectLink={setSelectedLink}
                beginGesture={draft.beginGesture}
                onMove={(moves) => draft.live((p) => movePieces(p, moves))}
                onLink={(from, to) => {
                  const before = linksOf(plan).length;
                  draft.change((p) => addLink(p, from, to));
                  if (linksOf(addLink(plan, from, to)).length === before) {
                    toast.message(t("builder.cantLink", "Those two can't be connected that way."));
                  }
                }}
                onRemoveLink={(link) => {
                  draft.change((p) => removeLink(p, link));
                  setSelectedLink(null);
                }}
              />
            )}

            {!empty && !q.isLoading ? (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-end justify-between gap-2">
                <div className="rounded-lg border bg-card/95 px-2.5 py-1.5 backdrop-blur">
                  <LinkLegend />
                </div>
                <div className="rounded-lg border bg-card/95 px-2.5 py-1.5 text-xs text-muted-foreground backdrop-blur">
                  {t("builder.counts", "Devices {{devices}} · Printers {{printers}} · Sections {{sections}}", counts)}
                </div>
              </div>
            ) : null}
          </div>

          <aside className="w-full shrink-0 overflow-y-auto border-t xl:w-[340px] xl:border-s xl:border-t-0">
            {!q.isLoading && !q.isError ? (
              <Inspector
                branchId={branchId}
                plan={plan}
                selection={selection}
                editable={editable}
                change={draft.change}
                onSelect={select}
                onRemove={remove}
                problems={problems}
                categories={view?.categories ?? []}
                registered={view?.devices ?? []}
                savedSlots={savedSlots}
                openItems={openItems}
                itemOverrides={itemOverrides}
              />
            ) : null}
          </aside>
        </div>
      </div>

      {saved ? (
        <ReviewDialog
          open={reviewing}
          onOpenChange={setReviewing}
          before={view?.saved ? saved : EMPTY_PLAN}
          after={plan}
          routingNow={view?.routing_mode ?? "till"}
          openItems={openItems}
          saving={saving}
          onConfirm={() => void save()}
        />
      ) : null}
    </Page>
  );
}

// ── Small parts ─────────────────────────────────────────────────────────────

const Divider = () => <span aria-hidden className="mx-1 h-4 w-px bg-border" />;

function IconButton({
  label, onClick, disabled, children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" onClick={onClick} disabled={disabled}>
          {children}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function AddItem({ icon: Icon, label, onSelect }: { icon: React.ComponentType<{ className?: string }>; label: string; onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect}>
      <Icon className="size-4" />
      {label}
    </DropdownMenuItem>
  );
}

/** What each kind of line means. The dash pattern carries it, not colour alone. */
function LinkLegend() {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {(["shows", "prints", "receipt", "host"] as const).map((kind) => {
        const s = LINK_STYLE[kind];
        return (
          <li key={kind} className="flex items-center gap-1.5">
            <svg width="22" height="8" aria-hidden className={cn("shrink-0")}>
              <line x1="1" y1="4" x2="21" y2="4" stroke={s.stroke} strokeWidth={s.width} strokeDasharray={s.dash} />
            </svg>
            {linkLabel(t, kind)}
          </li>
        );
      })}
    </ul>
  );
}

