import { describe, expect, it, vi } from "vitest";

import { PassError, preparePass } from "./prepare-pass";

const PKPASS = "application/vnd.apple.pkpass";

function reply(status: number, type: string | null, body = new Uint8Array([1, 2, 3])) {
  return new Response(status === 204 ? null : body, {
    status,
    headers: type ? { "content-type": type } : {},
  });
}

describe("preparePass", () => {
  it("resolves once a real pass has fully arrived", async () => {
    const fetchImpl = vi.fn(async () => reply(200, PKPASS));
    await expect(preparePass("/p.pkpass", { fetchImpl })).resolves.toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledWith(
      "/p.pkpass",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("rejects with the server's status when it refuses", async () => {
    const fetchImpl = vi.fn(async () => reply(503, "application/json"));
    await expect(preparePass("/p.pkpass", { fetchImpl })).rejects.toMatchObject({
      name: "PassError",
      status: 503,
    });
  });

  it("rejects a 200 that is not a pass — an HTML error page, say", async () => {
    // A misrouted request can answer 200 with the app shell. Handing THAT to
    // Safari would open a page, not a pass; better to say it failed.
    const fetchImpl = vi.fn(async () => reply(200, "text/html"));
    await expect(preparePass("/p.pkpass", { fetchImpl })).rejects.toBeInstanceOf(PassError);
  });

  it("reports a dead connection as status 0", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    await expect(preparePass("/p.pkpass", { fetchImpl })).rejects.toMatchObject({ status: 0 });
  });

  it("lets an abort through untouched", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    await expect(preparePass("/p.pkpass", { fetchImpl })).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});
