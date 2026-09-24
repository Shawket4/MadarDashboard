/**
 * The plan being edited: a local draft over the saved plan, with undo.
 *
 * Unlike the floor, the builder does NOT autosave. A plan is only coherent as
 * a whole (a section whose screen was removed before its new one was added
 * would lose orders in between), and the spec asks for a review of what a
 * change does before it applies (CH-4). So edits collect in a draft, the header
 * says there are unsaved changes, and Save shows what will happen first.
 *
 * The saved plan keeps flowing in (realtime `branch.plan_changed` refetches
 * it). A draft with no changes simply follows it; a draft WITH changes keeps
 * them and says that someone else saved, rather than dropping their work or
 * silently writing over the newer plan (the server refuses that anyway).
 */
import { useCallback, useEffect, useRef, useState } from "react";

import {
  applyRedo, applyUndo, emptyHistory, pushHistory, type UndoHistory,
} from "@/features/floor/util";
import { samePlan, type Plan } from "./plan";

export interface PlanDraft {
  /** What the canvas shows: the draft, or the saved plan when nothing changed. */
  plan: Plan | null;
  /** The version the draft was started from; what a save must match. */
  baseVersion: number | null;
  dirty: boolean;
  /** Someone saved a newer plan while this draft had changes. */
  overtaken: boolean;
  /** Apply an edit as one undo step. */
  change: (edit: (plan: Plan) => Plan) => void;
  /** Start a continuous gesture (a drag): one undo step for all of it. */
  beginGesture: () => void;
  /** Update during a gesture, without adding undo steps. */
  live: (edit: (plan: Plan) => Plan) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Drop the draft and follow the saved plan again. */
  discard: () => void;
  /** Replace the draft wholesale (an earlier version loaded), as one undo step. */
  replace: (plan: Plan) => void;
  /** After a save: the saved plan is the new base. */
  adopt: (plan: Plan, version: number) => void;
}

export function usePlanDraft(saved: Plan | null, savedVersion: number | null): PlanDraft {
  const [draft, setDraft] = useState<Plan | null>(null);
  const [base, setBase] = useState<{ plan: Plan; version: number } | null>(null);
  const [history, setHistory] = useState<UndoHistory<Plan>>(emptyHistory);

  const draftRef = useRef(draft);
  const historyRef = useRef(history);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { historyRef.current = history; }, [history]);

  const dirty = !!draft && !!base && !samePlan(draft, base.plan);

  // Follow the saved plan while there is nothing of our own to keep.
  useEffect(() => {
    if (!saved || savedVersion === null) return;
    if (dirty) return;
    setBase({ plan: saved, version: savedVersion });
    setDraft(saved);
  }, [saved, savedVersion, dirty]);

  const overtaken = dirty && savedVersion !== null && base !== null && savedVersion !== base.version;

  const change = useCallback((edit: (plan: Plan) => Plan) => {
    const current = draftRef.current;
    if (!current) return;
    const next = edit(current);
    if (next === current) return;
    setHistory((h) => pushHistory(h, current));
    setDraft(next);
  }, []);

  const beginGesture = useCallback(() => {
    const current = draftRef.current;
    if (current) setHistory((h) => pushHistory(h, current));
  }, []);

  const live = useCallback((edit: (plan: Plan) => Plan) => {
    setDraft((d) => (d ? edit(d) : d));
  }, []);

  const step = useCallback((fn: typeof applyUndo) => {
    const current = draftRef.current;
    if (!current) return;
    const result = fn(historyRef.current, current);
    if (!result) return;
    setHistory(result.history);
    setDraft(result.value);
  }, []);

  const discard = useCallback(() => {
    setHistory(emptyHistory());
    if (saved && savedVersion !== null) {
      setBase({ plan: saved, version: savedVersion });
      setDraft(saved);
    }
  }, [saved, savedVersion]);

  const replace = useCallback((plan: Plan) => change(() => plan), [change]);

  const adopt = useCallback((plan: Plan, version: number) => {
    setHistory(emptyHistory());
    setBase({ plan, version });
    setDraft(plan);
  }, []);

  return {
    plan: draft,
    baseVersion: base?.version ?? null,
    dirty,
    overtaken,
    change,
    beginGesture,
    live,
    undo: () => step(applyUndo),
    redo: () => step(applyRedo),
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    discard,
    replace,
    adopt,
  };
}
