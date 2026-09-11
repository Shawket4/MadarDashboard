import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import "@/i18n";
import { SocialLinks } from "./social-links";

const link = (key: string, url: string, label = key) => ({ key, label, url });

describe("SocialLinks", () => {
  it("renders nothing at all for a shop with no links", () => {
    // No heading, no empty row, no invitation to add some: this is the
    // customer's page, not the shop's settings.
    const { container } = render(<SocialLinks links={[]} accent="#0D6273" />);
    expect(container).toBeEmptyDOMElement();
    expect(render(<SocialLinks links={undefined} accent="#0D6273" />).container).toBeEmptyDOMElement();
  });

  it("renders one labelled link per platform, in a new tab", () => {
    render(
      <SocialLinks
        links={[link("instagram", "https://instagram.com/rue", "Instagram"), link("website", "https://rue.example", "Website")]}
        accent="#0D6273"
      />,
    );
    const anchors = screen.getAllByRole("link");
    expect(anchors).toHaveLength(2);
    expect(anchors[0]).toHaveAttribute("href", "https://instagram.com/rue");
    expect(anchors[0]).toHaveTextContent("Instagram");
    for (const a of anchors) {
      expect(a).toHaveAttribute("target", "_blank");
      // A new tab must not be handed a reference back to this page.
      expect(a.getAttribute("rel")).toContain("noopener");
    }
  });

  it("keeps the wire's order, and its label for a platform it has no glyph for", () => {
    // The server owns the list and the order (`orgs::social::PLATFORMS`); a
    // platform added there before this page learns it still renders.
    render(
      <SocialLinks
        links={[link("website", "https://rue.example", "Website"), link("threads", "https://threads.net/rue", "Threads")]}
        accent="#0D6273"
      />,
    );
    const anchors = screen.getAllByRole("link");
    expect(anchors.map((a) => a.textContent)).toEqual(["Website", "Threads"]);
    expect(anchors[1]!.querySelector("svg")).not.toBeNull();
  });

  it("drops anything that is not https, whatever the server said", () => {
    render(
      <SocialLinks
        links={[link("instagram", "javascript:alert(1)"), link("facebook", "http://facebook.com/rue"), link("x", "https://x.com/rue")]}
        accent="#0D6273"
      />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://x.com/rue");
  });
});
