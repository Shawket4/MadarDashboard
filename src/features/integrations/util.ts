import { queryClient } from "@/data/api/query";
import { env } from "@/data/config/env";
import type { CredentialSummary } from "@/data/api/generated/models";

/** Orval keys queries by endpoint PATH, so the prefix is the route, not the resource. */
export const invalidateCredentials = () =>
  queryClient.invalidateQueries({
    predicate: (q) =>
      typeof q.queryKey[0] === "string" &&
      (q.queryKey[0] as string).startsWith("/integrations/credentials"),
  });

export const isRevoked = (c: CredentialSummary) => !!c.revoked_at;

/**
 * The analytics endpoint a partner calls, ready to paste into a handoff email.
 *
 * There is no branch parameter — the credential decides which branch the caller
 * reads — so this URL is identical for every partner and differs only by the
 * username/password sent with it.
 */
export const analyticsUrl = () => {
  const base = (env.VITE_API_URL ?? "").replace(/\/+$/, "");
  return `${base}/integrations/analytics/orders?from=YYYY-MM-DD&to=YYYY-MM-DD`;
};

/**
 * The literal `Authorization` header value for these credentials.
 *
 * `btoa` only accepts latin1, and a partner could be given a non-ASCII password
 * one day, so the string is UTF-8 encoded to bytes first rather than assuming
 * every character fits in a byte.
 */
export const basicAuthHeader = (username: string, secret: string) => {
  const bytes = new TextEncoder().encode(`${username}:${secret}`);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return `Basic ${btoa(binary)}`;
};

/** Lowercase alphanumerics that are unambiguous in a username. */
const SUFFIX_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/**
 * The random tail of a generated username.
 *
 * Usernames are unique across the WHOLE cluster (Basic auth carries no tenant
 * hint, so the backend looks one up by name alone). This suffix is what makes a
 * collision vanishingly unlikely without the operator having to invent a
 * globally-unique name themselves.
 *
 * Held separately from the label slug so that typing in the label field
 * re-slugs the prefix without churning the suffix — and so "regenerate" means
 * something distinct from "keep typing".
 */
export const randomUsernameSuffix = (): string => {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SUFFIX_ALPHABET[b % SUFFIX_ALPHABET.length]).join("");
};

/**
 * `("Rue — One Ninety", "k7m2xq")` → `"rue-one-ninety-k7m2xq"`.
 *
 * Falls back to `partner` when the label is empty or entirely non-latin, so the
 * result is always a valid 3–64 character username the backend will accept.
 */
export const buildUsername = (label: string, suffix: string): string => {
  const base =
    label
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "partner";
  return `${base}-${suffix}`;
};
