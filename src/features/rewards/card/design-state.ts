/**
 * The card designer's state: the design being edited, which element is
 * selected, and what was last saved. One reducer, so every edit (mouse,
 * keyboard, panels) goes through the same clamping onto the 12×6 grid.
 * What is allowed is madar-card's to say (`card_validate`); this only keeps
 * cells whole and inside the grid.
 */
import type { CardDesign, Cell, Element, ElementKind, FieldSource } from "@/data/api/generated/models";
import { footerIsPaper, luminance } from "@/components/loyalty-card/card-assets";

export const COLS = 12;
export const ROWS = 6;

export interface EditorState {
  design: CardDesign;
  selected: number | null;
  /** The design as last loaded or saved (JSON), to tell a dirty draft. */
  saved: string;
}

export type Action =
  | { type: "load"; design: CardDesign }
  | { type: "saved" }
  | { type: "template"; design: CardDesign }
  | { type: "select"; index: number | null }
  | { type: "move"; index: number; dc: number; dr: number }
  | { type: "resize"; index: number; dw: number; dh: number }
  | { type: "place"; index: number; cell: Cell }
  | { type: "add"; kind: ElementKind; cell: Cell }
  | { type: "remove"; index: number }
  | { type: "kind"; index: number; kind: ElementKind }
  | { type: "patch"; patch: Partial<Pick<CardDesign, "colours" | "ground" | "stamp" | "apple" | "google">> };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** A cell kept whole and inside the grid (a move never shrinks it; a resize never moves it). */
export function clampCell(c: Cell): Cell {
  const w = clamp(Math.round(c.w), 1, COLS);
  const h = clamp(Math.round(c.h), 1, ROWS);
  return { w, h, col: clamp(Math.round(c.col), 0, COLS - w), row: clamp(Math.round(c.row), 0, ROWS - h) };
}

export const moveCell = (c: Cell, dc: number, dr: number): Cell => clampCell({ ...c, col: c.col + dc, row: c.row + dr });

export const resizeCell = (c: Cell, dw: number, dh: number): Cell => ({
  ...c,
  w: clamp(c.w + dw, 1, COLS - c.col),
  h: clamp(c.h + dh, 1, ROWS - c.row),
});

const withElements = (s: EditorState, elements: Element[]): EditorState => ({ ...s, design: { ...s.design, elements } });
const elementsOf = (s: EditorState) => s.design.elements ?? [];
const setCell = (s: EditorState, i: number, f: (c: Cell) => Cell) =>
  withElements(
    s,
    elementsOf(s).map((e, j) => (j === i ? { ...e, cell: f(e.cell) } : e)),
  );

export function initEditor(design: CardDesign): EditorState {
  return { design, selected: null, saved: JSON.stringify(design) };
}

export function reducer(s: EditorState, a: Action): EditorState {
  switch (a.type) {
    case "load":
      return initEditor(a.design);
    case "saved":
      return { ...s, saved: JSON.stringify(s.design) };
    case "template":
      return { ...s, design: a.design, selected: null };
    case "select":
      return { ...s, selected: a.index };
    case "move":
      return setCell(s, a.index, (c) => moveCell(c, a.dc, a.dr));
    case "resize":
      return setCell(s, a.index, (c) => resizeCell(c, a.dw, a.dh));
    case "place":
      return setCell(s, a.index, () => clampCell(a.cell));
    case "add": {
      const next = [...elementsOf(s), { kind: a.kind, cell: clampCell(a.cell) }];
      return { ...withElements(s, next), selected: next.length - 1 };
    }
    case "remove":
      return { ...withElements(s, elementsOf(s).filter((_, j) => j !== a.index)), selected: null };
    case "kind":
      return withElements(
        s,
        elementsOf(s).map((e, j) => (j === a.index ? { ...e, kind: a.kind } : e)),
      );
    case "patch":
      return { ...s, design: { ...s.design, ...a.patch } };
  }
}

export const isDirty = (s: EditorState) => JSON.stringify(s.design) !== s.saved;

/** A new element's size, before `card_first_free` finds it a place. */
export function defaultSize(kind: ElementKind["type"]): { w: number; h: number } {
  switch (kind) {
    case "stamps":
      return { w: 6, h: 2 };
    case "bar":
      return { w: 6, h: 1 };
    case "count":
      return { w: 3, h: 2 };
    case "text":
      return { w: 4, h: 1 };
    case "logo":
      return { w: 2, h: 2 };
  }
}

/** A field source as a select value ("balance:2", "member") and back. */
export const sourceKey = (f: FieldSource): string => (f.type === "member" ? "member" : `${f.type}:${f.track}`);
export function sourceFrom(key: string): FieldSource {
  if (key === "member") return { type: "member" };
  const [type, track] = key.split(":");
  return { type: type as "balance" | "progress" | "rewards", track: Number(track) };
}

/** Arrow keys on a selected element: move, or resize with Shift. On a mirrored (Arabic) card left and right swap. */
export function keyAction(key: string, shift: boolean, index: number, mirrored: boolean): Action | null {
  const h = mirrored ? -1 : 1;
  const d: Record<string, [number, number]> = {
    ArrowLeft: [-h, 0],
    ArrowRight: [h, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const v = d[key];
  if (!v) return null;
  return shift ? { type: "resize", index, dw: v[0], dh: v[1] } : { type: "move", index, dc: v[0], dr: v[1] };
}

export { footerIsPaper, luminance };

export function contrast(a: string, b: string): number | null {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}


