/**
 * A link that arrives from the API goes into an `href` only if it is a web
 * link — never `javascript:`, `data:` or the like. The card page is reached
 * with nothing but a token, so it trusts nothing it is handed.
 */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}
