import { afterEach, describe, expect, it, vi } from "vitest";

import { env } from "@/data/config/env";
import { endServerSession } from "./server-session";

describe("endServerSession", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("ends the session on the server with the token and the cookie", () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    endServerSession("tok");
    expect(fetch).toHaveBeenCalledWith(`${env.VITE_API_URL}/auth/session`, {
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
    expect(fetch).not.toHaveBeenCalled();
    expect(() => endServerSession("tok")).not.toThrow();
  });
});
