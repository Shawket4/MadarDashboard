import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

await import("@/i18n");
const { MadarFooter, StorefrontShell } = await import("./storefront-shell");
const { madarSiteHref, signatureSource } = await import("./madar-site");

const shop = { orgName: "Drops", logoUrl: null, background: "#7B1E3A", ownBranding: true };

const renderShell = (brand: typeof shop | null) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <StorefrontShell brand={brand} product="loyalty">
        <p>page</p>
      </StorefrontShell>
    </QueryClientProvider>,
  );

describe("StorefrontShell footer", () => {
  // One footer, whoever's page it is: a branded shop's customers see the same
  // signature as everyone else's.
  for (const [who, brand] of [["a branded shop", shop], ["Madar's own page", null]] as const) {
    it(`signs ${who} the same way`, () => {
      renderShell(brand);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveTextContent("Loyalty cards by Madar POS");
      expect(footer).toHaveTextContent(/©/);
      expect(footer.querySelector('img[src="/Icon.svg"]')).not.toBeNull();
    });
  }
});

describe("MadarFooter signature", () => {
  // The badge is one link to Madar POS's own site, on every public page: a new tab,
  // so a cart or a half-done sign-up is not lost, and it says so to a screen reader.
  const expectSignature = (name: string, campaign: string) => {
    const link = screen.getByRole("link", { name: `${name} (opens in a new tab)` });
    expect(link).toHaveAttribute(
      "href",
      `https://get.madar-pos.cloud/en/?utm_source=localhost&utm_medium=powered_by&utm_campaign=${campaign}`,
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    // The mark is inside it, and so is the arrow.
    expect(link.querySelector('img[src="/Icon.svg"]')).not.toBeNull();
    expect(link.querySelector("svg")).not.toBeNull();
  };

  it("names the product the page is", () => {
    render(<MadarFooter product="ordering" />);
    expectSignature("Online ordering by Madar POS", "ordering");
  });

  it("says Powered by where the page names no product (the links page, the menu)", () => {
    render(<MadarFooter />);
    expectSignature("Powered by Madar POS", "shop_page");
  });
});

describe("madarSiteHref", () => {
  it("goes straight to the page's language, tagged with the shop and product", () => {
    expect(madarSiteHref("ar", "drops", "ordering")).toBe(
      "https://get.madar-pos.cloud/ar/?utm_source=drops&utm_medium=powered_by&utm_campaign=ordering",
    );
    expect(madarSiteHref("en-US", "", "loyalty")).toBe(
      "https://get.madar-pos.cloud/en/?utm_source=madar&utm_medium=powered_by&utm_campaign=loyalty",
    );
  });

  it("names the shop by its host, or our host by its name", () => {
    expect(signatureSource("drops.madar-pos.cloud")).toBe("drops");
    expect(signatureSource("order.madar-pos.cloud")).toBe("order");
    expect(signatureSource("localhost")).toBe("localhost");
  });
});
