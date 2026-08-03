import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { downloadBlob, downloadUrl } from "./download";

describe("downloadUrl", () => {
  afterEach(() => vi.restoreAllMocks());

  it("clicks an anchor that is attached to the document, then detaches it", () => {
    // The whole point of the helper: Firefox ignores a click on a detached
    // anchor, so assert connectedness at the moment of the click.
    let connectedAtClick: boolean | null = null;
    let downloadAttr: string | null = null;
    const spy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        connectedAtClick = this.isConnected;
        downloadAttr = this.download;
      });

    downloadUrl("data:text/plain;base64,aGk=", "hello.txt");

    expect(spy).toHaveBeenCalledOnce();
    expect(connectedAtClick).toBe(true);
    expect(downloadAttr).toBe("hello.txt");
    // Nothing left behind in the DOM.
    expect(document.querySelectorAll("a[download]")).toHaveLength(0);
  });
});

describe("downloadBlob", () => {
  const created: string[] = [];
  const revoked: string[] = [];

  beforeEach(() => {
    created.length = 0;
    revoked.length = 0;
    // jsdom implements neither of these.
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: (_b: Blob) => {
        const u = `blob:mock/${created.length}`;
        created.push(u);
        return u;
      },
      revokeObjectURL: (u: string) => revoked.push(u),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not revoke the object URL synchronously", () => {
    downloadBlob(new Blob(["x"]), "f.zip");

    expect(created).toHaveLength(1);
    // The regression guard: revoking here would race the browser's own read of
    // the blob and yield a silent zero-byte download on WebKit.
    expect(revoked).toHaveLength(0);

    vi.advanceTimersByTime(60_000);
    expect(revoked).toEqual(created);
  });
});
