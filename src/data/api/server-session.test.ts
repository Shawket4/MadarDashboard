import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "@/data/config/env";
import { adoptServerSession, endServerSession, shareServerSession } from "./server-session";

const URL = `${env.VITE_SESSION_URL ?? env.VITE_API_URL}/auth/session`;

describe("the shared session", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("ends the session on the server with the token and the cookie", () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    endServerSession("tok");
    expect(fetch).toHaveBeenCalledWith(URL, {
      method: "DELETE",
      headers: { Authorization: "Bearer tok" },
      credentials: "include",
      keepalive: true,
    });
  });

  it("does nothing without a token, and never throws", () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetch);
    endServerSession(null);
    shareServerSession(null);
    expect(fetch).not.toHaveBeenCalled();
    expect(() => endServerSession("tok")).not.toThrow();
    expect(() => shareServerSession("tok")).not.toThrow();
  });

  it("shares a token with the cookie", () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    shareServerSession("tok");
    expect(fetch).toHaveBeenCalledWith(URL, {
      method: "POST",
      headers: { Authorization: "Bearer tok" },
      credentials: "include",
    });
  });

  it("adopts a live shared session, and nothing else", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ token: "shared" })));
    await expect(adoptServerSession()).resolves.toBe("shared");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ code: "SESSION_NONE" }, { status: 401 })),
    );
    await expect(adoptServerSession()).resolves.toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(adoptServerSession()).resolves.toBeNull();
  });

  it("gives up on a slow answer", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_: string, init: RequestInit) =>
        new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("aborted")))),
      ),
    );
    await expect(adoptServerSession(10)).resolves.toBeNull();
  });
});
