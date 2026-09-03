/**
 * Redaction of personal data from Sentry events.
 *
 * # This is a COMPLIANCE CONTROL, not defence in depth. Do not remove it.
 *
 * The published Madar privacy policy tells merchants, their staff, and their
 * customers that error reports exclude personal data. That statement has to be
 * true *on the wire*, so everything an event can carry passes through
 * {@link scrubEvent} before it leaves the browser.
 *
 * # The personal data this dashboard actually handles
 *
 * The denylist below is written from what this app renders and sends, not from
 * a generic list:
 *
 *  - **Customers** — order `customer_name`, delivery `customer_phone`,
 *    `address_line`, `place_name`, `floor`, `unit_number`, `landmark`,
 *    `delivery_notes`, and `customer_lat` / `customer_lng` (a home address as a
 *    coordinate pair).
 *  - **Staff** — user `name`, `email`, `phone`, `national_id`,
 *    `base_salary_piastres`, `emergency_contact_name` / `_phone`, and the
 *    attendance geofence fixes `check_in_latitude` / `check_in_longitude`.
 *  - **Credentials** — the bearer JWT this app holds in `localStorage` and
 *    sends on every request, delivery OTP codes, and WhatsApp device tokens.
 *
 * All of those appear in axios request configs, breadcrumb URLs, React Query
 * cache keys, and — the hard case — interpolated into free-text error messages.
 *
 * # Three matching rules, in order
 *
 * 1. {@link PII_KEY_ALLOWLIST} — checked FIRST. Keys where the value is a
 *    machine's word for itself (`os.name`, `sdk.name`). Without it the `name`
 *    fragment in rule 2 redacts the SDK's own metadata and events can no longer
 *    say which browser or platform they came from.
 * 2. {@link PII_KEY_DENYLIST} — case-insensitive **substring**. Long enough not
 *    to collide: `latitude`, never `lat`, which would also hit `translation`.
 * 3. {@link PII_KEY_EXACT} — case-insensitive **equality**, for short forms a
 *    substring rule cannot express. A login query string uses `pass=`, not
 *    `password=`. These MUST stay exact: as substrings, `pass` would eat
 *    `bypass` and `lat` would eat `translate`.
 *
 * # Keep these lists identical across all three surfaces
 *
 * The same three lists exist in the Rust backend
 * (`src/observability/scrub.rs`) and the Flutter app
 * (`lib/app/observability.dart`). They will drift unless something fails when
 * they do — see `scripts/check-scrub-parity.sh` in the backend repo, which is
 * wired into `preflight.sh` and CI.
 */
import type { ErrorEvent, EventHint, Breadcrumb, Event } from "@sentry/react";

/** What a denied value is replaced with. */
export const REDACTED = "[redacted]";

/** Case-insensitive **substring** matches. */
export const PII_KEY_DENYLIST: readonly string[] = [
  // Contact details
  "phone",
  "mobile",
  "msisdn",
  "whatsapp",
  "email",
  // Deliberately broad: `customer_name`, `user_name`, `emergency_contact_name`
  // and `place_name` are all personal data here. The allowlist is what keeps
  // this from eating `os.name`.
  "name",
  "customer",
  "recipient",
  // Addresses and geography
  "address",
  "street",
  "building",
  "apartment",
  "landmark",
  "postcode",
  "zipcode",
  "latitude",
  "longitude",
  "coordinate",
  "geolocation",
  // Government identity and pay
  "national_id",
  "nationalid",
  "passport",
  "salary",
  "wage",
  "payslip",
  "payroll",
  // Credentials
  "password",
  "passwd",
  "passphrase",
  "secret",
  "token",
  "credential",
  "cookie",
  "jwt",
  "bearer",
  "api_key",
  "apikey",
  "authorization",
  "signature",
  "private_key",
  "privatekey",
  "pin_hash",
  "pinhash",
  "otp_code",
  "sessionid",
  "session_token",
  // Payment instruments
  "iban",
  "card_number",
  "cardnumber",
];

/**
 * Case-insensitive **equality** matches — short forms a substring rule cannot
 * safely express.
 *
 * These exist because real payloads use them: a sign-in query string carries
 * `pass=`, a teller login carries `pin=`, a delivery verification carries
 * `otp=`, and a geofence fix carries `lat=` / `lng=`. Every one is missed by
 * the longer spellings above.
 *
 * They must stay EXACT. As substrings `pass` eats `bypass`, `lat` eats
 * `translate` and `latency`, `key` eats `keyboard`, and `user` eats
 * `user_agent` — each of which quietly destroys the debugging value of an event
 * while protecting nothing.
 */
export const PII_KEY_EXACT: readonly string[] = [
  "pass",
  "pin",
  "otp",
  "lat",
  "lng",
  "lon",
  "ssn",
  "nid",
  "dob",
  "tel",
  "addr",
  "key",
  "auth",
  "user",
  "owner",
  "uid",
  "cvv",
  "cvc",
  "gps",
  "pwd",
];

/**
 * Checked **before** the denylist. Keys whose value is a machine describing
 * itself, not a person. Matched as `parent.key`.
 *
 * `device.name` is deliberately absent: that is a person's own label for their
 * device, which is exactly the data this file exists to stop.
 */
export const PII_KEY_ALLOWLIST: readonly string[] = [
  "os.name",
  "runtime.name",
  "browser.name",
  "sdk.name",
  "job.name",
  "app.name",
  "package.name",
  "integration.name",
  "transaction.name",
  "span.name",
  "event.name",
  "device.family",
  "device.model",
];

/** True when a key must be redacted, given the key of the object containing it. */
export function isPiiPath(parent: string | undefined, key: string): boolean {
  const k = key.toLowerCase();
  // 1. Allowlist first, or the `name` fragment eats the SDK's own metadata.
  if (parent && PII_KEY_ALLOWLIST.includes(`${parent.toLowerCase()}.${k}`)) return false;
  if (PII_KEY_ALLOWLIST.includes(k)) return false;
  // 2. Exact short forms.
  if (PII_KEY_EXACT.includes(k)) return true;
  // 3. Substrings.
  return PII_KEY_DENYLIST.some((needle) => k.includes(needle));
}

/** True when a key must be redacted, ignoring any parent context. */
export function isPiiKey(key: string): boolean {
  return isPiiPath(undefined, key);
}

// ── Free text ───────────────────────────────────────────────────────────────

/**
 * `key = value`, `key: value`, `"key": "value"` — the shapes a serialized
 * object, a JSON fragment and a URL query all collapse into once they are one
 * string.
 *
 * `/` and `?` are delimiters specifically so a URL does not swallow itself:
 * without them the leading `https:` matches as a key and consumes the entire
 * URL as one value, and the `?phone=` inside it is never seen at all.
 */
const LABELLED = /("?([A-Za-z_][A-Za-z0-9_-]*)"?\s*[:=]\s*)("[^"]*"|'[^']*'|\[redacted\]|[^,;&/?\s})\]"]+)/gi;
/** `Bearer <token>` in free text, which the labelled rule cannot see. */
const AUTH_SCHEME = /\b(bearer|basic|token)\s+[A-Za-z0-9\-._~+/=]{8,}/gi;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
/** Loose phone-shaped runs, confirmed by {@link looksLikePhone}. */
const PHONE = /(?:\+|00)?\d[\d ()-]{6,18}\d/g;

/**
 * True when a digit run plausibly dials somewhere, rather than being an id, a
 * timestamp or a money amount. Tuned for Egypt (`01XXXXXXXXX`,
 * `+201XXXXXXXXX`) while still catching any internationally-prefixed run.
 */
function looksLikePhone(raw: string): boolean {
  const prefixed = raw.startsWith("+") || raw.startsWith("00");
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return false;
  if (prefixed) return true;
  return digits.startsWith("0") || digits.startsWith("20");
}

/**
 * Redact personal data **inside** a free-text string.
 *
 * # Why this exists
 *
 * The structured scrubber redacts by KEY. It cannot clean a message. An error
 * whose text interpolates a response body, a login URL, or a serialized object
 * walks straight past every rule above and lands in the exception value — the
 * single most-read field on an issue.
 *
 * The tempting fix is to withhold messages entirely. That is worse: it leaves
 * events with an operation name and no indication of what went wrong. So this
 * redacts *within* the text and keeps the key, so a message still says which
 * field was involved:
 *
 * ```text
 *   before: no customer for phone=+201000000000 in branch 7
 *   after:  no customer for phone=[redacted] in branch 7
 * ```
 *
 * Ordinary diagnostics must come through untouched — a network error, a parser
 * position, a status code. Over-redaction produces events that arrive, look
 * fine, and cannot be acted on.
 */
export function sanitizeText(input: string): string {
  if (!input) return input;
  return input
    .replace(LABELLED, (whole, prefix: string, key: string, value: string) =>
      // Idempotent: the hook can run over already-scrubbed text, and a second
      // pass must not corrupt the marker into `[redacted]]`.
      value.startsWith(REDACTED) || !isPiiKey(key) ? whole : `${prefix}${REDACTED}`,
    )
    .replace(AUTH_SCHEME, (_whole, scheme: string) => `${scheme} ${REDACTED}`)
    .replace(EMAIL, REDACTED)
    .replace(PHONE, (m) => (looksLikePhone(m) ? REDACTED : m));
}

// ── Structured redaction ────────────────────────────────────────────────────

/**
 * Redact denied keys anywhere inside an arbitrary value.
 *
 * A denied key takes its **whole subtree**, whatever its type. That is
 * deliberate: `customer` is only ever an object, and walking into it field by
 * field would let an unanticipated child through.
 *
 * Strings surviving the key check are still passed through {@link sanitizeText},
 * because a value under an innocent key (`detail`, `error`) can carry a phone
 * number in free text.
 */
export function redactValue(value: unknown, parent?: string, depth = 0): unknown {
  // A depth bound, because a cyclic or pathological object graph in a
  // `beforeSend` hook would hang the page rather than fail to report.
  if (depth > 12) return REDACTED;
  if (typeof value === "string") return sanitizeText(value);
  if (Array.isArray(value)) return value.map((v) => redactValue(v, parent, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isPiiPath(parent, k) ? REDACTED : redactValue(v, k, depth + 1);
    }
    return out;
  }
  return value;
}

function redactStringMap(
  map: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!map) return map;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    out[k] = isPiiKey(k) ? REDACTED : sanitizeText(v);
  }
  return out;
}

/** Strip a URL down to origin + path — the query is where `?phone=` rides. */
export function stripUrlQuery(url: string): string {
  const cut = url.split(/[?#]/)[0];
  return sanitizeText(cut);
}

function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  const data = crumb.data ? (redactValue(crumb.data) as Record<string, unknown>) : undefined;
  // A fetch/xhr breadcrumb's `url` is a full URL with the query attached, and
  // this app puts customer identifiers in query parameters.
  if (data && typeof data.url === "string") data.url = stripUrlQuery(data.url);
  return {
    ...crumb,
    message: crumb.message ? sanitizeText(crumb.message) : crumb.message,
    data,
  };
}

/**
 * The `beforeSend` / `beforeSendTransaction` hook.
 *
 * Returns the event unconditionally: deciding *whether* an event is worth
 * reporting belongs at the capture site, and this hook's single responsibility
 * is redaction, so a future capture path cannot bypass it by being added
 * somewhere that forgot to filter.
 */
export function scrubEvent<T extends Event>(event: T, _hint?: EventHint): T {
  // Identity is dropped OUTRIGHT rather than trimmed. Removing individual
  // fields leaves the privacy claim depending on the SDK's definition of
  // "default", which a future release is free to widen; removing the whole
  // context does not.
  delete event.user;
  delete event.server_name;

  if (event.request) {
    // The body is the biggest single exposure: every order carries a customer
    // name, phone and address. There is no safe subset.
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripUrlQuery(event.request.url);
    event.request.headers = redactStringMap(event.request.headers);
  }

  event.tags = redactStringMap(event.tags as Record<string, string> | undefined) as typeof event.tags;
  if (event.extra) event.extra = redactValue(event.extra) as typeof event.extra;
  if (event.contexts) {
    const contexts: Record<string, unknown> = {};
    for (const [name, ctx] of Object.entries(event.contexts)) {
      contexts[name] = redactValue(ctx, name);
    }
    event.contexts = contexts as typeof event.contexts;
  }
  if (event.breadcrumbs) event.breadcrumbs = event.breadcrumbs.map(scrubBreadcrumb);

  // Free text last, and the part the key-based rules above cannot reach.
  if (typeof event.message === "string") event.message = sanitizeText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = sanitizeText(exception.value);
  }
  // A transaction name built from a URL would otherwise carry the query.
  if (typeof event.transaction === "string") {
    event.transaction = stripUrlQuery(event.transaction);
  }
  return event;
}

/** `beforeSend` needs the narrower `ErrorEvent` signature. */
export const beforeSend = (event: ErrorEvent, hint: EventHint): ErrorEvent =>
  scrubEvent(event, hint);

/**
 * Breadcrumbs are scrubbed as they are RECORDED, not only as they are sent.
 * A breadcrumb dropped here never enters the ring buffer at all, so it cannot
 * be attached to an event by any path — including ones that skip `beforeSend`.
 */
export const beforeBreadcrumb = (crumb: Breadcrumb): Breadcrumb | null => scrubBreadcrumb(crumb);
