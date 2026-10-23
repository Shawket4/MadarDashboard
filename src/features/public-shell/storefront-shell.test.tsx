import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

const i18n = (await import("@/i18n")).default;
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
      expect(footer).toHaveTextContent("Loyalty cards by");
      expect(footer).toHaveTextContent(/©/);
      expect(screen.getByRole("img", { name: "Madar POS" })).toBeInTheDocument();
    });
  }
});

describe("StorefrontShell header", () => {
  const shell = (product: "loyalty" | "ordering") =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <StorefrontShell brand={shop} product={product}>
          <p>page</p>
        </StorefrontShell>
      </QueryClientProvider>,
    );

  it("opens a Rewards page with Rewards by Madar's lockup, going where the footer's badge goes", () => {
    shell("loyalty");
    const header = screen.getByRole("banner");
    const link = within(header).getByRole("link", { name: "Rewards by Madar (opens in a new tab)" });
    expect(link).toHaveAttribute(
      "href",
      "https://get.madar-pos.cloud/en/?utm_source=localhost&utm_medium=powered_by&utm_campaign=loyalty",
    );
    expect(link).toHaveAttribute("target", "_blank");
    // The kit's compact lockup, Ink for the light theme and Paper for the dark,
    // sized at its 28px minimum before either arrives.
    const [ink, paper] = Array.from(link.querySelectorAll("img"));
    expect(ink.getAttribute("src")).toMatch(/rewards-lockup-en-ink.*\.svg/);
    expect(paper.getAttribute("src")).toMatch(/rewards-lockup-en-paper.*\.svg/);
    for (const img of [ink, paper]) {
      expect(img).toHaveAttribute("height", "28");
      expect(img).toHaveAttribute("width", "132");
    }
    expect(paper).toHaveAttribute("loading", "lazy");
    // The shop's mark is on its card, not here.
    expect(within(header).queryByText("Drops")).not.toBeInTheDocument();
  });

  it("draws the Arabic lockup on an Arabic page", async () => {
    await i18n.changeLanguage("ar");
    shell("loyalty");
    const link = within(screen.getByRole("banner")).getByRole("link", { name: "مكافآت من مدار (يفتح في علامة تبويب جديدة)" });
    const [ink] = Array.from(link.querySelectorAll("img"));
    expect(ink.getAttribute("src")).toMatch(/rewards-lockup-ar-ink.*\.svg/);
    expect(ink).toHaveAttribute("width", "103");
    await i18n.changeLanguage("en");
  });

  it("keeps the shop's mark on every other page", () => {
    shell("ordering");
    const header = screen.getByRole("banner");
    expect(within(header).queryByRole("link")).not.toBeInTheDocument();
    expect(within(header).getByText("Drops")).toBeInTheDocument();
  });
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
    // The orbit (the kit's optical size) and the wordmark, named for screen readers.
    expect(link.querySelector('svg[viewBox="0 0 81 81"]')).not.toBeNull();
    expect(within(link).getByRole("img", { name: "Madar POS" })).toBeInTheDocument();
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
