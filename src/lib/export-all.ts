/**
 * Pulling a whole filtered dataset into the browser, for an export.
 *
 * Every spreadsheet this app produces is built HERE, in the tab, by ExcelJS —
 * there is no server-side export and there should not be one. What that costs
 * is that the data has to arrive first, and a list page holds one page of it.
 * Exporting what happens to be on screen is the bug this exists to prevent: a
 * filter says "March, Maadi branch" and the file says "the first hundred rows
 * of March, Maadi branch", which is worse than no file because nothing about it
 * looks wrong.
 *
 * So an export re-runs the page's own query with the page's own filters, walks
 * it to the end, and hands back everything.
 *
 * ## The ceiling is not negotiable, it is arithmetic
 *
 * ExcelJS builds the workbook in this tab. Somewhere in the tens of thousands
 * of rows that tab stops responding and shortly after it dies — and it dies
 * AFTER the user has waited through the whole download, which is the worst
 * possible moment to find out. So there is a hard stop, and hitting it is a
 * refusal BEFORE the work rather than a crash after it. "Narrow the range" is a
 * thing a person can act on; a hung tab is not.
 */
import i18n from "@/i18n";

/**
 * The most rows one file may carry. Roughly a 5–10 MB workbook and under a
 * minute of work in the tab; past it, neither of those stays true.
 */
export const EXPORT_ROW_CEILING = 50_000;

/**
 * How many rows to ask for per request while walking.
 *
 * A ceiling on the ask, not a promise about the answer: endpoints clamp this
 * to their own maximum and the walk copes — see the loop.
 */
const PAGE = 500;

/**
 * Marks a read as part of an export, so the API counts it as one.
 *
 * An export is dozens of requests for one file. The backend throttles the
 * INTENT rather than the requests — five files a minute — which only works if
 * the intent is declared. Pass this as the generated client's second argument.
 */
export const EXPORT_REQUEST = { headers: { "X-Madar-Export": "1" } } as const;

/** Raised when a dataset is too large to build in a browser tab. */
export class ExportTooLargeError extends Error {
  constructor(public readonly rows: number) {
    super(
      i18n.t("export.tooLarge", {
        rows: rows.toLocaleString(),
        max: EXPORT_ROW_CEILING.toLocaleString(),
        defaultValue:
          "That is about {{rows}} rows, and a spreadsheet built in the browser tops out around {{max}}. Narrow the dates or the branch and try again.",
      }),
    );
    this.name = "ExportTooLargeError";
  }
}

/**
 * Walk a paged endpoint to the end, honouring whatever filters the caller bakes
 * into `page`.
 *
 * `page` receives an offset and a limit and returns that slice, plus the total
 * where the endpoint reports one — which lets the refusal happen on the FIRST
 * request rather than after twenty of them.
 */
export async function fetchAllPages<T>(
  page: (offset: number, limit: number) => Promise<{ rows: T[]; total?: number }>,
): Promise<T[]> {
  const out: T[] = [];
  let offset = 0;

  for (;;) {
    const { rows, total } = await page(offset, PAGE);
    if (total !== undefined && total > EXPORT_ROW_CEILING) {
      throw new ExportTooLargeError(total);
    }
    out.push(...rows);

    // Stop on an EMPTY page, never on a short one, and advance by what
    // actually arrived rather than by what was asked for.
    //
    // Endpoints clamp `limit` — the members list at 200, some inventory reads
    // at 1000, and there is no reason to think that set is closed. Asking for
    // 500 and treating 200 as "that's the end" would have exported the first
    // two hundred members of a programme and said nothing about the rest. A
    // clamp should cost an extra request, not the data.
    if (rows.length === 0) break;
    if (total !== undefined && out.length >= total) break;
    if (out.length > EXPORT_ROW_CEILING) throw new ExportTooLargeError(out.length);
    offset += rows.length;
  }
  return out;
}
