/**
 * Table geometry: local edits, undo, and autosave.
 *
 * ── Why autosave changes the design ─────────────────────────────────────────
 *
 * With a Save button, local state could drift from the server for as long as
 * you liked and the button was the reconciliation point. Autosave removes that
 * point, which forces three things to be explicit:
 *
 *   1. **What is in flight.** A gesture is saved shortly after it settles, not
 *      on every frame, or a single drag would be two hundred requests.
 *   2. **Whose version is authoritative.** Every table carries the `updated_at`
 *      it was loaded with; the server rejects a write whose row moved since.
 *      Without that, two managers arranging one room silently overwrite each
 *      other every few hundred milliseconds.
 *   3. **What undo means.** It no longer means "discard unsaved work" — there
 *      is none. It means "apply the inverse and save that", so undo is itself
 *      a change that persists.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { saveLayout } from "@/data/api/generated/api";
import type { FloorTable } from "@/data/api/generated/models";
import { getErrorMessage } from "@/data/api/errors";
import {
  applyRedo, applyUndo, emptyHistory, invalidateFloor, pushHistory,
  type GeoItem, type UndoHistory,
} from "./util";

/**
 * How long after the last change a save fires.
 *
 * Long enough that a continuous drag is one request, short enough that letting
 * go and looking away feels saved. Every further edit restarts the clock, so a
 * flurry of nudges still collapses into a single write.
 */
export const AUTOSAVE_DEBOUNCE_MS = 600;

export type SaveState = "idle" | "pending" | "saving" | "saved" | "conflict" | "error";

export interface FloorGeometry {
  /** Live geometry for a table: the local edit if there is one, else the row. */
  geoOf: (table: FloorTable) => GeoItem;
  items: GeoItem[];
  /** Stage a change. Call `beginGesture()` first so undo groups it. */
  setGeo: (updates: GeoItem[]) => void;
  beginGesture: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saveState: SaveState;
  /** Force a flush — used before navigating away. */
  flush: () => Promise<void>;
}

type GeoMap = Record<string, GeoItem>;

export function useFloorGeometry(branchId: string, tables: FloorTable[]): FloorGeometry {
  const { t } = useTranslation();
  const [geo, setGeo] = useState<GeoMap>({});
  const [history, setHistory] = useState<UndoHistory<GeoMap>>(emptyHistory);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const geoRef = useRef(geo);
  const historyRef = useRef(history);
  const tablesRef = useRef(tables);
  useEffect(() => { geoRef.current = geo; }, [geo]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { tablesRef.current = tables; }, [tables]);

  /**
   * The `updated_at` each table was loaded with, which is the token the server
   * checks. Captured when a table is FIRST seen and then held: refetching after
   * our own save would otherwise hand us a newer token and quietly defeat the
   * guard we are relying on.
   */
  const tokens = useRef(new Map<string, string>());
  useEffect(() => {
    for (const tb of tables) {
      if (!tokens.current.has(tb.id)) tokens.current.set(tb.id, tb.updated_at);
    }
  }, [tables]);

  const geoOf = useCallback(
    (tb: FloorTable): GeoItem =>
      geo[tb.id] ?? {
        id: tb.id,
        x: tb.pos_x,
        y: tb.pos_y,
        w: tb.width,
        h: tb.height,
        rot: tb.rotation,
      },
    [geo],
  );

  const items = useMemo(() => tables.map(geoOf), [tables, geoOf]);

  // ── Saving ────────────────────────────────────────────────────────────────

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Ids changed since the last successful save. */
  const dirty = useRef(new Set<string>());

  const doSave = useCallback(async () => {
    const ids = [...dirty.current];
    if (ids.length === 0) return;
    // Cleared up front: an edit made WHILE this request is in flight must
    // survive it and be saved by the next pass, not be swallowed here.
    dirty.current.clear();
    setSaveState("saving");

    const current = geoRef.current;
    const payload = ids
      .map((id) => {
        const g = current[id];
        const tb = tablesRef.current.find((x) => x.id === id);
        if (!g || !tb) return null;
        return {
          id,
          // save_layout always writes section_id; keep the table where it is.
          section_id: tb.section_id ?? null,
          pos_x: g.x,
          pos_y: g.y,
          width: g.w,
          height: g.h,
          rotation: g.rot,
          expected_updated_at: tokens.current.get(id) ?? tb.updated_at,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
    if (payload.length === 0) return;

    try {
      const rows = await saveLayout({ branch_id: branchId, tables: payload });
      // Adopt the tokens the write returned, so the next save guards against
      // the row as it now is rather than as it was when the page loaded.
      for (const row of rows) tokens.current.set(row.id, row.updated_at);
      setSaveState("saved");
      void invalidateFloor();
    } catch (err) {
      const message = getErrorMessage(err);
      const isConflict =
        (err as { response?: { status?: number } })?.response?.status === 409;
      if (isConflict) {
        // Nothing was written — the server rolls the whole batch back — so the
        // local edits are still the only copy. Put them back in the dirty set
        // rather than dropping them, and let the user decide after reloading.
        for (const id of ids) dirty.current.add(id);
        setSaveState("conflict");
        toast.error(message, {
          duration: 12_000,
          action: {
            label: t("floor.reload", "Reload"),
            onClick: () => {
              dirty.current.clear();
              setGeo({});
              tokens.current.clear();
              setSaveState("idle");
              void invalidateFloor();
            },
          },
        });
      } else {
        for (const id of ids) dirty.current.add(id);
        setSaveState("error");
        toast.error(message);
      }
    }
  }, [branchId, t]);

  const schedule = useCallback(() => {
    setSaveState("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void doSave(), AUTOSAVE_DEBOUNCE_MS);
  }, [doSave]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await doSave();
  }, [doSave]);

  // A pending save must not be lost to a navigation or a closing tab.
  useEffect(() => {
    const onHide = () => {
      if (dirty.current.size > 0) void doSave();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [doSave]);

  // ── Editing ───────────────────────────────────────────────────────────────

  const beginGesture = useCallback(() => {
    setHistory((h) => pushHistory(h, geoRef.current));
  }, []);

  const applyGeo = useCallback(
    (updates: GeoItem[]) => {
      if (updates.length === 0) return;
      setGeo((prev) => {
        const next = { ...prev };
        for (const u of updates) next[u.id] = u;
        return next;
      });
      for (const u of updates) dirty.current.add(u.id);
      schedule();
    },
    [schedule],
  );

  /**
   * Undo/redo now write. With no Save button there is no "unsaved" state to
   * revert to, so stepping back is itself an edit that has to reach the server.
   */
  const stepHistory = useCallback(
    (step: typeof applyUndo) => {
      const result = step(historyRef.current, geoRef.current);
      if (!result) return;
      setHistory(result.history);
      setGeo(result.value);
      // Everything the step touched in either direction has to be re-saved.
      for (const id of new Set([...Object.keys(result.value), ...Object.keys(geoRef.current)])) {
        dirty.current.add(id);
      }
      schedule();
    },
    [schedule],
  );

  const undo = useCallback(() => stepHistory(applyUndo), [stepHistory]);
  const redo = useCallback(() => stepHistory(applyRedo), [stepHistory]);

  return {
    geoOf,
    items,
    setGeo: applyGeo,
    beginGesture,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    saveState,
    flush,
  };
}
