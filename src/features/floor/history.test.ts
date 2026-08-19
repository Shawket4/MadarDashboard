import { describe, expect, it } from "vitest";

import {
  HISTORY_LIMIT, type UndoHistory,
  applyRedo, applyUndo, emptyHistory, pushHistory,
} from "./util";

/**
 * Undo is where off-by-one errors hide: the classic bugs are losing the first
 * edit, needing two presses to take back one gesture, and a redo branch that
 * survives a new edit and then replays something the user never did.
 */

type State = string;
const push = (h: UndoHistory<State>, s: State) => pushHistory(h, s);

describe("undo history", () => {
  it("takes back one gesture per press", () => {
    // Arrange → move → move, then step back twice.
    let history = emptyHistory<State>();
    let current: State = "a";
    history = push(history, current); current = "b";
    history = push(history, current); current = "c";

    const first = applyUndo(history, current)!;
    expect(first.value).toBe("b");

    const second = applyUndo(first.history, first.value)!;
    expect(second.value).toBe("a");
  });

  it("reaches the very first edit rather than stopping one short", () => {
    let history = emptyHistory<State>();
    history = push(history, "start");
    const step = applyUndo(history, "changed")!;
    expect(step.value).toBe("start");
    expect(applyUndo(step.history, step.value)).toBeNull();
  });

  it("no-ops instead of throwing when there is nothing to undo or redo", () => {
    expect(applyUndo(emptyHistory<State>(), "a")).toBeNull();
    expect(applyRedo(emptyHistory<State>(), "a")).toBeNull();
  });

  it("round-trips undo then redo back to where it was", () => {
    let history = emptyHistory<State>();
    history = push(history, "a");
    const undone = applyUndo(history, "b")!;
    expect(undone.value).toBe("a");
    const redone = applyRedo(undone.history, undone.value)!;
    expect(redone.value).toBe("b");
  });

  it("abandons the redo branch once a new edit lands", () => {
    // Undo, then do something else — the future you walked away from must not
    // come back, or redo replays an edit the user never made.
    let history = emptyHistory<State>();
    history = push(history, "a");
    const undone = applyUndo(history, "b")!;
    expect(undone.history.future).toHaveLength(1);

    const afterNewEdit = push(undone.history, "a");
    expect(afterNewEdit.future).toHaveLength(0);
    expect(applyRedo(afterNewEdit, "c")).toBeNull();
  });

  it("bounds the stack so a long session cannot grow forever", () => {
    let history = emptyHistory<State>();
    for (let i = 0; i < HISTORY_LIMIT + 40; i += 1) history = push(history, `s${i}`);
    expect(history.past).toHaveLength(HISTORY_LIMIT);
    // The oldest entries are the ones dropped; the newest survive.
    expect(history.past[history.past.length - 1]).toBe(`s${HISTORY_LIMIT + 39}`);
  });

  it("keeps snapshots independent of later mutation", () => {
    // Geometry snapshots are objects; the stack must not alias live state.
    const live = { t1: { x: 0 } };
    const history = pushHistory(emptyHistory<typeof live>(), { ...live });
    live.t1 = { x: 999 };
    expect(history.past[0].t1.x).toBe(0);
  });
});
