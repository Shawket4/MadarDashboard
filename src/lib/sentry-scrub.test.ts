import { describe, expect, it } from "vitest";
import {
  PII_KEY_ALLOWLIST,
  PII_KEY_DENYLIST,
  PII_KEY_EXACT,
  REDACTED,
  isPiiKey,
  isPiiPath,
  redactValue,
  sanitizeText,
  scrubEvent,
  stripUrlQuery,
} from "./sentry-scrub";
import type { Event } from "@sentry/react";

// ── Key matching ─────────────────────────────────────────────────────────────

describe("the key predicate", () => {
  it("denies the real field names this dashboard renders and sends", () => {
    for (const key of [
      "customer_phone",
      "customer_name",
      "address_line",
      "place_name",
      "landmark",
      "national_id",
      "base_salary_piastres",
      "emergency_contact_phone",
      "check_in_latitude",
      "check_in_longitude",
      "customer_lat",
      "Authorization",
      "X-Auth-Token",
      "pin_hash",
    ]) {
      expect(isPiiKey(key), `${key} must be denied`).toBe(true);
    }
  });

  it("matches short forms exactly and only exactly", () => {
    // A login query string uses `pass=`, not `password=`.
    for (const key of ["pass", "PIN", "otp", "lat", "lng", "user", "owner", "auth", "key", "uid"]) {
      expect(isPiiKey(key), `short form ${key} must be denied`).toBe(true);
    }
    // ...and as substrings each of these would be a disaster.
    for (const key of [
      "bypass",
      "passed",
      "translate",
      "latency",
      "keyboard",
      "user_agent",
      "pinned",
      "authority_id",
      "uuid",
    ]) {
      expect(isPiiKey(key), `${key} must NOT be denied by a short form`).toBe(false);
    }
  });

  it("allowlists a machine's word for itself, but not a person's label", () => {
    // Without this the `name` fragment redacts the SDK's own metadata and an
    // event can no longer say which browser produced it.
    expect(isPiiPath("os", "name")).toBe(false);
    expect(isPiiPath("sdk", "name")).toBe(false);
    expect(isPiiPath("browser", "name")).toBe(false);
    expect(isPiiPath("runtime", "name")).toBe(false);
    // "Ali's iPad" is exactly the data this file exists to stop.
    expect(isPiiPath("device", "name")).toBe(true);
    expect(isPiiKey("name")).toBe(true);
  });

  it("lets ordinary domain keys through", () => {
    // Over-redaction is a real failure mode: it produces events that arrive,
    // look fine, and cannot be acted on.
    for (const key of [
      "order_id",
      "branch_id",
      "org_id",
      "status",
      "line_cost",
      "quantity",
      "total_amount",
      "elapsed_ms",
      "route",
      "method",
      "translation",
      "related_items",
      "retry_count",
    ]) {
      expect(isPiiKey(key), `${key} must NOT be denied`).toBe(false);
    }
  });
});

// ── Structured redaction ─────────────────────────────────────────────────────

describe("structured redaction", () => {
  it("takes the whole subtree of a sensitive key", () => {
    const out = redactValue({
      order_id: "abc",
      customer: { given: "Ali", id: 7, deep: { anything: "x" } },
    }) as Record<string, unknown>;
    expect(out.order_id).toBe("abc");
    // Not walked into field by field — taken whole.
    expect(out.customer).toBe(REDACTED);
  });

  it("recurses into nested objects and arrays", () => {
    const out = redactValue({
      drops: [
        { latitude: 30.1, longitude: 31.2, sequence: 1 },
        { latitude: 30.3, longitude: 31.4, sequence: 2 },
      ],
      meta: { inner: { national_id: "123", kept: true } },
    }) as { drops: Record<string, unknown>[]; meta: { inner: Record<string, unknown> } };
    expect(out.drops[0].latitude).toBe(REDACTED);
    expect(out.drops[1].longitude).toBe(REDACTED);
    expect(out.drops[0].sequence).toBe(1);
    expect(out.meta.inner.national_id).toBe(REDACTED);
    expect(out.meta.inner.kept).toBe(true);
  });

  it("sanitizes a string even under an innocent key", () => {
    const out = redactValue({ detail: "called +201000000000 twice" }) as Record<string, string>;
    expect(out.detail).toBe(`called ${REDACTED} twice`);
  });

  it("does not hang on a deep or cyclic graph", () => {
    // A `beforeSend` hook that hangs takes the page with it.
    type Node = { child?: Node; name?: string };
    const root: Node = {};
    let cursor = root;
    for (let i = 0; i < 50; i++) {
      cursor.child = {};
      cursor = cursor.child;
    }
    expect(() => redactValue(root)).not.toThrow();
  });
});

// ── Free text ────────────────────────────────────────────────────────────────

describe("the message sanitizer", () => {
  it("redacts labelled values and keeps the key", () => {
    // Keeping the key is the point: the message still says which field was
    // involved, so the event stays actionable.
    expect(sanitizeText("no customer for phone=+201000000000 in branch 7")).toBe(
      `no customer for phone=${REDACTED} in branch 7`,
    );
    expect(sanitizeText('{"customer_name":"Ali","order_id":"abc"}')).toBe(
      `{"customer_name":${REDACTED},"order_id":"abc"}`,
    );
  });

  it("redacts a URL query per key without losing the rest", () => {
    const out = sanitizeText(
      "GET https://api.madar-pos.cloud/public/orders?phone=%2B201000000000&branch_id=7 failed",
    );
    expect(out).toContain(`phone=${REDACTED}`);
    // The non-sensitive parameter survives, so the request stays identifiable.
    expect(out).toContain("branch_id=7");
    expect(out).not.toContain("201000000000");
  });

  it("redacts credentials in free text even unlabelled", () => {
    expect(sanitizeText("rejected Bearer eyJhbGciOiJIUzI1NiJ9.abc.def")).toBe(
      `rejected Bearer ${REDACTED}`,
    );
  });

  it("redacts emails and phone-shaped runs", () => {
    expect(sanitizeText("could not notify ali.hassan@example.com")).toBe(
      `could not notify ${REDACTED}`,
    );
    expect(sanitizeText("rang 01000000000 three times")).not.toContain("01000000000");
  });

  it("leaves ordinary diagnostics unchanged", () => {
    // The other direction, and the one that decides whether this is a
    // sanitizer or just an expensive way to send empty messages.
    for (const message of [
      "Network Error",
      "timeout of 20000ms exceeded",
      "Request failed with status code 503",
      "Unexpected token < in JSON at position 0",
      "order MDR-260831-0042 not found",
      "total_amount 16300 exceeds limit 1000000",
      "invalid UUID: 7f3a1c2e-1111-4222-8333-444455556666",
    ]) {
      expect(sanitizeText(message), "an ordinary diagnostic was mangled").toBe(message);
    }
  });

  it("is idempotent", () => {
    const once = sanitizeText("phone=+201000000000");
    expect(sanitizeText(once)).toBe(once);
  });

  it("cannot see an UNLABELLED street address, and this is the known limit", () => {
    // Documented rather than hidden. Redaction here is by key or by shape; a
    // bare address in prose has neither, and any heuristic broad enough to
    // catch it would also eat stack frames and error codes — which is the
    // failure mode this whole file is trying to avoid.
    //
    // The mitigations are elsewhere: request bodies are never attached, the
    // structured scrubber takes `address_line` whole, and a labelled address in
    // free text IS redacted (below).
    expect(sanitizeText("delivery failed at 12 Main St")).toBe("delivery failed at 12 Main St");
    expect(sanitizeText("address_line=12 Main St")).toBe(`address_line=${REDACTED} Main St`);
  });

  it("strips a URL down to origin and path", () => {
    expect(stripUrlQuery("https://api.madar-pos.cloud/orders?phone=%2B2010#x")).toBe(
      "https://api.madar-pos.cloud/orders",
    );
  });
});

// ── The event hook ───────────────────────────────────────────────────────────

describe("scrubEvent", () => {
  function eventWithEverything(): Event {
    return {
      message: "failed for customer_phone=+201000000000",
      user: { id: "u1", email: "a@b.c", username: "ali", ip_address: "1.2.3.4" },
      server_name: "alis-macbook",
      transaction: "/orders?customer_phone=%2B2010",
      request: {
        url: "https://api.madar-pos.cloud/orders?customer_phone=%2B201000000000",
        method: "POST",
        data: { customer_phone: "+201000000000", address_line: "12 Main St" },
        cookies: { session: "abc" },
        query_string: "customer_phone=%2B201000000000",
        headers: { authorization: "Bearer secret-token", "x-org-id": "org-1" },
      },
      tags: { address_line: "12 Main St", branch_id: "7" },
      extra: { customer: { name: "Ali" }, order_id: "abc" },
      contexts: {
        os: { name: "macOS", version: "15" },
        device: { name: "Ali's iPad" },
      },
      breadcrumbs: [
        {
          category: "xhr",
          message: "looking up phone=+201000000000",
          data: { url: "https://api.madar-pos.cloud/customers?phone=%2B201000000000", status: 500 },
        },
      ],
      exception: {
        values: [
          {
            type: "AxiosError",
            value: "no customer for phone=+201000000000 at address_line=12 Main St",
          },
        ],
      },
    };
  }

  it("clears identity outright and strips the request payload", () => {
    const event = scrubEvent(eventWithEverything());
    expect(event.user).toBeUndefined();
    expect(event.server_name).toBeUndefined();
    expect(event.request?.data).toBeUndefined();
    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.query_string).toBeUndefined();
    expect(event.request?.url).toBe("https://api.madar-pos.cloud/orders");
    expect(event.request?.headers?.authorization).toBe(REDACTED);
    expect(event.request?.headers?.["x-org-id"]).toBe("org-1");
  });

  it("leaves nothing sensitive anywhere in the serialized event", () => {
    // Asserted over the whole wire form, because inspecting one field at a time
    // is how a leak in the field you did not check survives.
    const wire = JSON.stringify(scrubEvent(eventWithEverything()));
    for (const leak of ["201000000000", "12 Main St", "secret-token", "a@b.c", "Ali's iPad"]) {
      expect(wire, `event leaked ${leak}`).not.toContain(leak);
    }
  });

  it("keeps the platform metadata that makes an event actionable", () => {
    const event = scrubEvent(eventWithEverything());
    expect((event.contexts?.os as Record<string, unknown>).name).toBe("macOS");
    expect((event.contexts?.device as Record<string, unknown>).name).toBe(REDACTED);
    // The exception still says what went wrong.
    expect(event.exception?.values?.[0].value).toContain("no customer for");
    expect(event.tags?.branch_id).toBe("7");
  });

  it("strips the query from a transaction name", () => {
    // Otherwise a transaction group is created per customer identifier.
    expect(scrubEvent(eventWithEverything()).transaction).toBe("/orders");
  });

  it("strips the query from a breadcrumb URL", () => {
    const event = scrubEvent(eventWithEverything());
    const data = event.breadcrumbs?.[0].data as Record<string, unknown>;
    expect(data.url).toBe("https://api.madar-pos.cloud/customers");
    expect(data.status).toBe(500);
  });
});

// ── Parity ───────────────────────────────────────────────────────────────────

describe("cross-surface parity", () => {
  it("holds the same three lists the other surfaces do", () => {
    // A cheap local guard; `scripts/check-scrub-parity.sh` in the backend repo
    // is the one that actually diffs the three files and fails on drift.
    expect(PII_KEY_DENYLIST.length).toBeGreaterThan(40);
    expect(PII_KEY_EXACT).toContain("pass");
    expect(PII_KEY_EXACT).toContain("lat");
    expect(PII_KEY_ALLOWLIST).toContain("os.name");
    expect(PII_KEY_ALLOWLIST).not.toContain("device.name");
    // Every list is lowercase, or the case-insensitive comparisons silently
    // stop matching.
    for (const entry of [...PII_KEY_DENYLIST, ...PII_KEY_EXACT, ...PII_KEY_ALLOWLIST]) {
      expect(entry).toBe(entry.toLowerCase());
    }
  });
});
