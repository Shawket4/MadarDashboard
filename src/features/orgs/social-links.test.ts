import { describe, expect, it } from "vitest";

import { isHttpsUrl, socialLinksPatch, socialLinksToForm } from "./social-links";

describe("isHttpsUrl", () => {
  it("accepts a full https address", () => {
    expect(isHttpsUrl("https://instagram.com/rue")).toBe(true);
  });

  it("refuses http rather than upgrading it", () => {
    // Rewriting the scheme would mean the field shows one address and the pass
    // carries another — and the server would 400 on it regardless.
    expect(isHttpsUrl("http://instagram.com/rue")).toBe(false);
  });

  it("refuses a bare handle or a scheme-less host", () => {
    expect(isHttpsUrl("@rue")).toBe(false);
    expect(isHttpsUrl("instagram.com/rue")).toBe(false);
    expect(isHttpsUrl("https://")).toBe(false);
  });

  it("refuses a javascript: URL", () => {
    // These end up as tappable links on a wallet pass.
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("socialLinksToForm", () => {
  it("fills every platform, and only with strings", () => {
    const form = socialLinksToForm({ instagram: "https://a.example", facebook: 42 });
    expect(form.instagram).toBe("https://a.example");
    // A non-string on the wire is not a link; it must not reach an input.
    expect(form.facebook).toBe("");
    expect(Object.values(form).every((v) => typeof v === "string")).toBe(true);
  });

  it("survives a missing object", () => {
    expect(socialLinksToForm(null).website).toBe("");
  });
});

describe("socialLinksPatch", () => {
  const empty = socialLinksToForm(null);

  it("sends only what was actually typed", () => {
    const patch = socialLinksPatch({ ...empty, x: "https://x.com/rue" }, null);
    expect(patch).toEqual({ x: "https://x.com/rue" });
  });

  it("sends an empty value to REMOVE a link that existed", () => {
    // Empty is how the server removes one; an absent key is not a removal, so
    // clearing a box has to send something.
    const patch = socialLinksPatch(empty, { tiktok: "https://tiktok.com/@rue" });
    expect(patch).toEqual({ tiktok: "" });
  });

  it("does not write empties for platforms that were never set", () => {
    const patch = socialLinksPatch({ ...empty, website: "https://rue.example" }, {
      website: "https://old.example",
    });
    expect(patch).toEqual({ website: "https://rue.example" });
  });

  it("trims what it sends", () => {
    const patch = socialLinksPatch({ ...empty, whatsapp: "  https://wa.me/20  " }, null);
    expect(patch).toEqual({ whatsapp: "https://wa.me/20" });
  });
});
