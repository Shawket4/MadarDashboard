/**
 * Printing codes: only the codes, at a size that prints true.
 *
 * `window.print()` on its own prints the whole dashboard — sidebar, scope bar,
 * buttons and all — which is what the table sheet used to do. Here the codes
 * are copied into one root at the end of `<body>`, `html.qr-printing` hides
 * every other child of `<body>` from the printer (`globals.css`), and the root
 * is removed again once the print dialog closes.
 *
 * What goes on the paper follows the output: an unbranded code prints as the
 * code alone — no label, no cut line, nothing but the image the server made
 * (which carries its own white quiet zone). A branded sheet keeps what it has
 * always had: each card with its table's label under it and a dashed cut line.
 *
 * Sizes are physical. One code prints at its real size: the A6 card at
 * 105 × 148 mm, the unbranded code at 70 mm (its size on the card), a receipt
 * code at 50 mm. A sheet of many fits A4: unbranded and receipt codes three a
 * row, cards two a row.
 */
import type { QrShape } from "./output";

export interface PrintItem {
  src: string;
  /** Printed under the code on a branded sheet; never on an unbranded one. */
  label?: string;
}

export const PRINT_ROOT_ID = "qr-print-root";
const PRINTING_CLASS = "qr-printing";
/** If an engine never fires `afterprint`, the root still goes. */
const CLEANUP_FALLBACK_MS = 60_000;

/** Builds the print root (exported for tests; `printCodes` is the entry point). */
export function buildPrintRoot(items: PrintItem[], shape: QrShape): HTMLDivElement {
  const root = document.createElement("div");
  root.id = PRINT_ROOT_ID;
  root.dataset.shape = shape;
  root.dataset.count = items.length === 1 ? "one" : "many";
  const branded = shape !== "plain";
  for (const item of items) {
    const cell = document.createElement("figure");
    cell.className = "qr-print-cell";
    if (branded && items.length > 1) cell.dataset.cut = "";
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = "";
    cell.appendChild(img);
    if (branded && item.label) {
      const caption = document.createElement("figcaption");
      caption.textContent = item.label;
      cell.appendChild(caption);
    }
    root.appendChild(cell);
  }
  return root;
}

export async function printCodes(items: PrintItem[], shape: QrShape): Promise<void> {
  if (items.length === 0) return;
  document.getElementById(PRINT_ROOT_ID)?.remove();
  const root = buildPrintRoot(items, shape);
  document.body.appendChild(root);
  document.documentElement.classList.add(PRINTING_CLASS);

  let done = false;
  const cleanup = () => {
    if (done) return;
    done = true;
    root.remove();
    document.documentElement.classList.remove(PRINTING_CLASS);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  setTimeout(cleanup, CLEANUP_FALLBACK_MS);

  // A data URL still has to be decoded before the printer can see it.
  await Promise.all(
    Array.from(root.querySelectorAll("img")).map((img) =>
      typeof img.decode === "function" ? img.decode().catch(() => undefined) : undefined,
    ),
  );
  window.print();
}
