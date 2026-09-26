import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

await import("@/i18n");
const { MadarFooter, StorefrontShell, signsQuietly } = await import("./storefront-shell");

const shop = { orgName: "Drops", logoUrl: null, background: "#7B1E3A" };
const madar = { orgName: "Corner Café", logoUrl: null, background: "#0D6273" };

const rights = () => screen.queryByText(/©/);

describe("signsQuietly", () => {
  it("follows the tier when the page was told it", () => {
    expect(signsQuietly({ ...shop, ownBranding: false })).toBe(false);
    expect(signsQuietly({ ...madar, ownBranding: true })).toBe(true);
  });

  it("reads the tier off the palette when it was not — the loyalty pages", () => {
    expect(signsQuietly(shop)).toBe(true);
    expect(signsQuietly(madar)).toBe(false);
    expect(signsQuietly({ ...madar, background: "#0d6273" })).toBe(false);
  });

  it("signs Madar's own page at full volume", () => {
    expect(signsQuietly(null)).toBe(false);
    expect(signsQuietly(undefined)).toBe(false);
  });
});

describe("MadarFooter", () => {
  it("drops the copyright line on a shop's own page, whichever page it is", () => {
    const { unmount } = render(<MadarFooter brand={shop} product="loyalty" />);
    expect(rights()).toBeNull();
    expect(screen.getByText("Loyalty cards powered by Madar")).toBeInTheDocument();
    unmount();
    render(<MadarFooter brand={madar} product="loyalty" />);
    expect(rights()).not.toBeNull();
  });
});

describe("StorefrontShell", () => {
  const renderShell = (pending: boolean) =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <StorefrontShell product="ordering" pending={pending}>
          <p>page</p>
        </StorefrontShell>
      </QueryClientProvider>,
    );

  it("holds the footer back while the page does not yet know whose it is", () => {
    renderShell(true);
    expect(screen.queryByRole("contentinfo")).toBeNull();
  });

  it("signs the page once it does", () => {
    renderShell(false);
    expect(screen.getByRole("contentinfo")).toHaveTextContent("Online ordering powered by Madar");
  });
});
