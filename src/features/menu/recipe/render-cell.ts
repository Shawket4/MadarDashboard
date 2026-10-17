import type { CellContext, ColumnDef } from "@tanstack/react-table";

/**
 * Render a grid cell by CALLING its renderer, never mounting it.
 *
 * `flexRender` mounts a function cell as a component, so its identity is the
 * component type. The recipe grids rebuild their columns whenever the blocks
 * change, which is every keystroke: each edit gave the cell a new type, React
 * remounted the input, and focus left after one character ("18" could not be
 * typed). Calling the renderer keeps the element types stable across rebuilds.
 * Cells rendered this way must not call hooks.
 */
export function renderCell<T>(def: ColumnDef<T>["cell"], ctx: CellContext<T, unknown>) {
  return typeof def === "function" ? def(ctx) : def;
}
