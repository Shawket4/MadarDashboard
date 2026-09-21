/**
 * Fetch a `.pkpass` all the way down BEFORE the browser is sent to it.
 *
 * A pass is built per member, on demand, and it is not instant even cached:
 * ~800KB of signed zip. A plain `<a href>` to it gives the page no signal at
 * all — nothing happens for seconds, so the customer taps again, and again —
 * but the plain navigation is also the ONLY hand-off iOS accepts: Safari shows
 * the "Add pass" sheet when a navigation answers with the pkpass content type,
 * and a blob URL of the same bytes is not reliably treated the same way.
 *
 * So this does not replace the navigation; it goes ahead of it. The page
 * fetches the pass itself, which is the slow part and the part that can fail,
 * and only then hands the same URL to the browser. The server has just built
 * (and cached) that exact pass, so the second request is quick, and Safari
 * gets the response shape it knows. The cost is the bytes twice; the gain is a
 * real "it has arrived" and a real "it did not".
 */

/** The content type Apple assigns to a pass; anything else is not one. */
const PKPASS = "application/vnd.apple.pkpass";

export class PassError extends Error {
  constructor(
    /** What the server said, or `0` when nothing came back at all. */
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PassError";
  }
}

/**
 * Resolve once the pass has arrived in full, reject if it will not.
 *
 * Reads the body to the end rather than stopping at the headers: the server
 * builds the pass before answering, so headers alone would mostly do, but
 * "arrived" is a promise to the customer and the last byte is what keeps it.
 */
export async function preparePass(
  url: string,
  { signal, fetchImpl = fetch }: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<void> {
  let res: Response;
  try {
    res = await fetchImpl(url, {
      credentials: "same-origin",
      headers: { Accept: PKPASS },
      signal,
    });
  } catch (err) {
    // A cancelled request is the caller's own doing; let it see the abort.
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new PassError(0, "network");
  }
  if (!res.ok) throw new PassError(res.status, `http ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes(PKPASS)) throw new PassError(res.status, "not a pass");
  await res.arrayBuffer();
}
