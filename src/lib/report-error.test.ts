/**
 * Assertions here are on the CAPTURED EVENT via a fake transport, not on the
 * code that builds it. Tags set on the wrong scope still produce an event; it
 * just arrives empty, which looks like it works.
 */
import { AxiosError, AxiosHeaders } from "axios";
import * as Sentry from "@sentry/react";
import { beforeEach, describe, expect, it } from "vitest";
import { beforeSend, REDACTED } from "./sentry-scrub";
import {
  reportApiError,
  reportHandledError,
  resetHandledErrorDedup,
  shouldReportApiError,
} from "./report-error";

const captured: Record<string, unknown>[] = [];

/** A transport that records what the SDK actually decided to send. */
function makeTransport() {
  return {
    send: (envelope: unknown) => {
      // Envelope shape: [header, [[itemHeader, payload], ...]]
      const items = (envelope as [unknown, [unknown, unknown][]])[1] ?? [];
      for (const [, payload] of items) {
        if (payload && typeof payload === "object") {
          captured.push(payload as Record<string, unknown>);
        }
      }
      return Promise.resolve({});
    },
    flush: () => Promise.resolve(true),
  };
}

function initTestSentry() {
  Sentry.init({
    dsn: "https://public@example.invalid/1",
    transport: () => makeTransport() as never,
    sendDefaultPii: false,
    beforeSend,
    // Deliberately no integrations: this asserts on OUR wiring, not on the
    // SDK's default breadcrumb collection.
    defaultIntegrations: false,
    integrations: [],
  });
}

function axiosFailure(status: number | undefined, url: string, code?: string): AxiosError {
  const error = new AxiosError(
    status ? `Request failed with status code ${status}` : "Network Error",
    code,
    { url, method: "post", headers: new AxiosHeaders() },
  );
  if (status !== undefined) {
    error.response = {
      status,
      statusText: "",
      data: { error: "boom" },
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
  }
  return error;
}

beforeEach(() => {
  captured.length = 0;
  // The dedup window is module-level and deliberately survives a single
  // session; without this reset one test's report suppresses the next's.
  resetHandledErrorDedup();
  initTestSentry();
});

describe("what an API failure is worth reporting", () => {
  it("reports 5xx", () => {
    expect(shouldReportApiError(axiosFailure(500, "/orders"))).toBe(true);
    expect(shouldReportApiError(axiosFailure(503, "/orders"))).toBe(true);
  });

  it("does not report ordinary 4xx", () => {
    // Validation, 401, 403, 404, 409 are normal API traffic; reporting them
    // drowns the issue stream. The backend reports the subset of 4xx that its
    // own data caused, which a browser cannot judge.
    for (const status of [400, 401, 403, 404, 409, 422]) {
      expect(shouldReportApiError(axiosFailure(status, "/orders"))).toBe(false);
    }
  });

  it("reports a request that never got a response", () => {
    // Unreachable API, DNS failure, CORS block, timeout — all real faults, and
    // none of them produces a status code.
    expect(shouldReportApiError(axiosFailure(undefined, "/orders"))).toBe(true);
  });

  it("does not report a cancelled request", () => {
    // Navigating away mid-request is not a failure.
    expect(shouldReportApiError(axiosFailure(undefined, "/orders", "ERR_CANCELED"))).toBe(false);
  });

  it("ignores anything that is not an axios error", () => {
    expect(shouldReportApiError(new Error("render exploded"))).toBe(false);
  });
});

describe("the captured event", () => {
  it("carries the route and status and no response body", async () => {
    reportApiError(axiosFailure(500, "/orders?customer_phone=%2B201000000000"));
    await Sentry.flush(100);

    expect(captured.length).toBe(1);
    const event = captured[0] as {
      tags: Record<string, string>;
      extra: Record<string, unknown>;
      fingerprint: string[];
    };
    expect(event.tags.component).toBe("api");
    expect(event.tags.operation).toBe("http_500");
    expect(event.extra.status).toBe(500);
    expect(event.extra.method).toBe("POST");
    // The query is stripped: this app puts customer identifiers in it.
    expect(event.extra.url).toBe("/orders");
    // ...and the response body is never attached at all.
    expect(JSON.stringify(event)).not.toContain("201000000000");
  });

  it("groups by component and operation, not by the message", () => {
    // A hundred spellings of "Network Error" are one problem.
    reportApiError(axiosFailure(500, "/a"));
    const event = captured[0] as { fingerprint: string[] };
    expect(event.fingerprint).toEqual(["handled", "api", "http_500"]);
  });

  it("separates an unreachable backend from a 500", () => {
    // Different causes, different fixes — so different issues.
    reportApiError(axiosFailure(500, "/a"));
    reportApiError(axiosFailure(undefined, "/b"));
    const operations = captured.map((e) => (e as { tags: Record<string, string> }).tags.operation);
    expect(operations).toEqual(["http_500", "unreachable"]);
  });

  it("raises one issue when the same failure reaches two paths", () => {
    // The interceptor reports it, and a component's own onError reports it too.
    reportApiError(axiosFailure(500, "/orders"));
    reportApiError(axiosFailure(500, "/orders"));
    expect(captured.length).toBe(1);
  });

  it("stops suppressing once the window is reset", () => {
    // Guards the dedup itself: a test that passes because NOTHING was reported
    // would look identical to one that passes because dedup worked.
    reportApiError(axiosFailure(500, "/orders"));
    expect(captured.length).toBe(1);
    resetHandledErrorDedup();
    reportApiError(axiosFailure(500, "/orders"));
    expect(captured.length).toBe(2);
  });

  it("sanitizes a message that interpolated personal data", () => {
    reportHandledError(
      { component: "orders", operation: "submit" },
      new Error("no customer for phone=+201000000000"),
    );
    const wire = JSON.stringify(captured[0]);
    expect(wire).not.toContain("201000000000");
    expect(wire).toContain(REDACTED);
    // ...and still says what failed.
    expect(wire).toContain("submit");
  });

  it("clears identity on the way out", () => {
    Sentry.setUser({ id: "u1", email: "a@b.c", username: "ali" });
    reportHandledError({ component: "orders", operation: "submit" }, new Error("boom"));
    const event = captured[0] as { user?: unknown };
    expect(event.user).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain("a@b.c");
  });
});
