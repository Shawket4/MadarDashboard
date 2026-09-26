import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

await import("@/i18n");
const { StorefrontShell } = await import("./storefront-shell");

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
  // One footer, full size, whoever's page it is: a branded shop's customers
  // see the same signature as everyone else's.
  for (const [who, brand] of [["a branded shop", shop], ["Madar's own page", null]] as const) {
    it(`signs ${who} in full`, () => {
      renderShell(brand);
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveTextContent("Loyalty cards powered by Madar");
      expect(footer).toHaveTextContent(/©/);
      expect(footer.querySelector("img")).toHaveClass("h-6");
    });
  }
});
