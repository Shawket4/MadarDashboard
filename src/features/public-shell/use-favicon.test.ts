/**
 * The favicon swap: which shop it names, and when it leaves the page alone.
 */
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useShopFavicon } from "./use-favicon";

function icons() {
  return [...document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')].map((l) => l.href);
}

describe("useShopFavicon", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("names the shop by id when the page knows it", () => {
    renderHook(() => useShopFavicon({ orgId: "org-7" }));
    const [href] = icons();
    expect(href).toContain("/public/orgs/favicon");
    expect(href).toContain("org_id=org-7");
    expect(href).toContain("size=180");
  });

  it("falls back to the hostname's slug", () => {
    renderHook(() => useShopFavicon({ slug: "rue" }));
    expect(icons()[0]).toContain("slug=rue");
  });

  it("prefers the id over the slug — the id cannot be wrong", () => {
    renderHook(() => useShopFavicon({ orgId: "org-7", slug: "rue" }));
    const [href] = icons();
    expect(href).toContain("org_id=org-7");
    expect(href).not.toContain("slug=");
  });

  it("leaves Madar's own icon alone when there is no shop", () => {
    document.head.innerHTML = '<link rel="icon" href="/madar.svg">';
    renderHook(() => useShopFavicon({ orgId: null, slug: null }));
    expect(icons()).toEqual([expect.stringContaining("/madar.svg")]);
  });

  it("replaces the shipped icon rather than adding a second one", () => {
    document.head.innerHTML = '<link rel="icon" href="/madar.svg">';
    renderHook(() => useShopFavicon({ slug: "rue" }));
    expect(icons()).toHaveLength(1);
    expect(icons()[0]).toContain("slug=rue");
  });

  it("sets the home-screen icon too, at a size worth saving", () => {
    renderHook(() => useShopFavicon({ slug: "rue" }));
    const apple = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    expect(apple?.href).toContain("size=180");
  });
});
