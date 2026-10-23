/**
 * The strip with its 12×6 grid over it: each element is a box that snaps to
 * whole cells. Drag a box to move it, drag its corner to resize it; or focus
 * it and use the arrow keys (Shift + arrows resizes). The footer's cell and,
 * when Apple's primary field is shown, the zone iOS writes it in are hatched:
 * nothing may sit there. On an Arabic card every cell is mirrored, as the pass is.
 */
import { useRef, type CSSProperties, type Dispatch, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";

import type { CardDesign, Cell, Element } from "@/data/api/generated/models";
import type { CardRules, CardState } from "@/lib/rules/card";
import { cn } from "@/lib/utils";

import { COLS, ROWS, keyAction, type Action } from "./design-state";
import { StripSvg } from "@/components/loyalty-card/strip-svg";

const MX = (16 / 375) * 100;
const MY = (8 / 144) * 100;
const CW = (100 - 2 * MX) / COLS;
const CH = (100 - 2 * MY) / ROWS;

function boxStyle(c: Cell, arabic: boolean): CSSProperties {
  const col = arabic ? COLS - c.col - c.w : c.col;
  return {
    left: `${MX + col * CW}%`,
    top: `${MY + c.row * CH}%`,
    width: `${c.w * CW}%`,
    height: `${c.h * CH}%`,
  };
}

const HATCH: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(45deg, color-mix(in oklab, var(--color-destructive) 45%, transparent) 0 2px, transparent 2px 8px)",
};

export function GridEditor({
  rules,
  design,
  state,
  selected,
  dispatch,
  disabled,
  elementLabel,
  photoUrl,
  logoUrl,
  problemIndexes,
}: {
  rules: CardRules;
  design: CardDesign;
  state: CardState;
  selected: number | null;
  dispatch: Dispatch<Action>;
  disabled?: boolean;
  elementLabel: (e: Element) => string;
  photoUrl?: string | null;
  logoUrl?: string | null;
  /** Elements a problem points at: drawn in the error colour. */
  problemIndexes: Set<number>;
}) {
  const { t } = useTranslation();
  const arabic = state.arabic;
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ index: number; mode: "move" | "resize"; x: number; y: number; cell: Cell } | null>(null);
  const primary = design.apple.primary != null;
  const r = rules.card_rules();
  const elements = design.elements ?? [];

  const begin = (e: PointerEvent, index: number, mode: "move" | "resize") => {
    if (disabled || e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { index, mode, x: e.clientX, y: e.clientY, cell: elements[index].cell };
    dispatch({ type: "select", index });
  };
  const track = (e: PointerEvent) => {
    const d = drag.current;
    const box = frame.current?.getBoundingClientRect();
    if (!d || !box || box.width === 0) return;
    const cw = (box.width * CW) / 100;
    const ch = (box.height * CH) / 100;
    const dc = Math.round((e.clientX - d.x) / cw) * (arabic ? -1 : 1);
    const dr = Math.round((e.clientY - d.y) / ch);
    const cell =
      d.mode === "move"
        ? { ...d.cell, col: d.cell.col + dc, row: d.cell.row + dr }
        : { ...d.cell, w: Math.max(1, d.cell.w + dc), h: Math.max(1, d.cell.h + dr) };
    dispatch({ type: "place", index: d.index, cell });
  };
  const end = () => {
    drag.current = null;
  };

  const onKey = (e: KeyboardEvent, index: number) => {
    if (disabled) return;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      dispatch({ type: "remove", index });
      return;
    }
    if (e.key === "Escape") {
      dispatch({ type: "select", index: null });
      return;
    }
    const a = keyAction(e.key, e.shiftKey, index, arabic);
    if (a) {
      e.preventDefault();
      dispatch({ type: "select", index });
      dispatch(a);
    }
  };

  return (
    <div className="space-y-2">
      <div
        ref={frame}
        className="relative overflow-hidden rounded-xl border bg-muted"
        onPointerMove={track}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerDown={() => !disabled && dispatch({ type: "select", index: null })}
      >
        <StripSvg rules={rules} design={design} state={state} store="apple" scale={2} photoUrl={photoUrl} logoUrl={logoUrl} primaryField={primary} />
        {/* The grid lines. */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: COLS + 1 }, (_, i) => (
            <span key={`c${i}`} className="absolute border-s border-dashed border-foreground/15" style={{ left: `${MX + i * CW}%`, top: `${MY}%`, height: `${100 - 2 * MY}%` }} />
          ))}
          {Array.from({ length: ROWS + 1 }, (_, i) => (
            <span key={`r${i}`} className="absolute border-t border-dashed border-foreground/15" style={{ top: `${MY + i * CH}%`, left: `${MX}%`, width: `${100 - 2 * MX}%` }} />
          ))}
          <span data-testid="zone-footer" className="absolute rounded-sm" style={{ ...boxStyle(r.footer_cell, arabic), ...HATCH }} title={t("rewards.card.footerZone", "Footer")} />
          {primary ? (
            <span data-testid="zone-primary" className="absolute rounded-sm" style={{ ...boxStyle(r.apple_primary_zone, arabic), ...HATCH }} />
          ) : null}
        </div>
        <div role="group" aria-label={t("rewards.card.gridLabel", "Strip layout")} aria-describedby="card-grid-help" className="absolute inset-0">
          {elements.map((el, i) => {
            const on = selected === i;
            const c = el.cell;
            return (
              <div
                key={i}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-pressed={on}
                aria-disabled={disabled || undefined}
                data-testid="grid-element"
                aria-label={t("rewards.card.elementAt", {
                  defaultValue: "{{what}}: column {{col}}, row {{row}}, {{w}} by {{h}} cells",
                  what: elementLabel(el),
                  col: c.col + 1,
                  row: c.row + 1,
                  w: c.w,
                  h: c.h,
                })}
                onPointerDown={(e) => begin(e, i, "move")}
                onFocus={() => !disabled && dispatch({ type: "select", index: i })}
                onKeyDown={(e) => onKey(e, i)}
                className={cn(
                  "absolute touch-none rounded-sm border-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60",
                  disabled ? "cursor-default border-transparent" : "cursor-move",
                  problemIndexes.has(i) ? "border-destructive" : on ? "border-primary" : "border-foreground/30 border-dashed",
                  on && "bg-primary/10",
                )}
                style={boxStyle(c, arabic)}
              >
                {on && !disabled ? (
                  <span
                    aria-hidden
                    onPointerDown={(e) => begin(e, i, "resize")}
                    className={cn(
                      "absolute bottom-0 size-3 translate-y-1/2 rounded-sm border-2 border-primary bg-card",
                      arabic ? "left-0 -translate-x-1/2 cursor-nesw-resize" : "right-0 translate-x-1/2 cursor-nwse-resize",
                    )}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <p id="card-grid-help" className="text-xs text-muted-foreground">
        {disabled
          ? t("rewards.card.gridHelpReadOnly", "The hatched areas are kept for the footer and Apple's primary field.")
          : t(
              "rewards.card.gridHelp",
              "Drag a box to move it, or its corner to resize it. With the keyboard: Tab to a box, arrows move it, Shift + arrows resize it, Delete removes it. Hatched areas are kept for the footer and Apple's primary field.",
            )}
      </p>
    </div>
  );
}
