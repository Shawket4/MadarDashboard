/**
 * The frame every kit field sits in: the same height, stroke, focus ring and
 * invalid colour as the plain `Input`, drawn on a wrapper so an icon, a unit
 * or a clear button can share the box with the text.
 */
export const shellClass = (opts: { invalid?: boolean; disabled?: boolean } = {}) =>
  [
    "group/field flex h-9 w-full min-w-0 items-center gap-1.5 rounded-md border bg-transparent px-2.5 shadow-xs",
    "transition-[color,box-shadow,border-color] motion-reduce:transition-none dark:bg-input/30",
    "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
    opts.invalid
      ? "border-destructive ring-destructive/20 focus-within:border-destructive focus-within:ring-destructive/20 dark:ring-destructive/40"
      : "border-input",
    opts.disabled ? "cursor-not-allowed opacity-50" : "",
  ].join(" ");

/** The bare `<input>` inside a shell: no border of its own, full width, 16px on phones. */
export const innerInputClass =
  "h-full w-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm";

/** Error text under a field; readable red, not the raw token. */
export const errorTextClass =
  "text-xs text-[color-mix(in_oklab,var(--color-destructive)_75%,var(--color-foreground))]";

/** Warning text; the raw amber is too light for text (CLAUDE.md), so mix it toward ink. */
export const warnTextClass =
  "text-xs text-[color-mix(in_oklab,var(--color-warning)_50%,var(--color-foreground))]";
