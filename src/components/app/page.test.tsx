import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Receipt } from "lucide-react";

import "@/i18n";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname: "/orders" }),
  Link: ({ children, ...p }: { children: React.ReactNode }) => <a {...p}>{children}</a>,
}));

import { PageHeader, SectionTabsProvider, navGlyphFor } from "./page";
import { StatusPill } from "./status-pill";

describe("PageHeader geometry", () => {
  it("always reserves the leading slot so the title never moves", () => {
    const { container, rerender } = render(<PageHeader title="Orders" />);
    const firstSlot = () => container.querySelector("header > div > div:first-child");
    expect(firstSlot()?.querySelector('[data-slot="page-glyph"]')).toBeInTheDocument();
    rerender(<PageHeader title="Orders" subtitle="This shift" actions={<button>x</button>} back={{ onClick: () => {} }} />);
    // With a back button, the same slot holds it — the title stays second.
    expect(firstSlot()?.querySelector("button[aria-label]")).toBeInTheDocument();
    expect(container.querySelector("header > div > div:nth-child(2) h1")).toHaveTextContent("Orders");
  });

  it("subtitle sits below the title row", () => {
    render(<PageHeader title="Orders" subtitle="This shift" />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.parentElement?.nextElementSibling).toHaveTextContent("This shift");
  });

  it("renders section tabs from the layout in the below row", () => {
    render(
      <SectionTabsProvider tabs={[{ to: "/orders", label: "All" }, { to: "/orders/x", label: "Other" }]}>
        <PageHeader title="Orders" />
      </SectionTabsProvider>,
    );
    expect(screen.getByText("All").closest("a")).toHaveAttribute("aria-current", "page");
  });

  it("finds the most specific nav glyph", () => {
    expect(navGlyphFor("/orders")).toBe(Receipt);
    expect(navGlyphFor("/nowhere")).toBeUndefined();
  });
});

describe("StatusPill", () => {
  it("never relies on colour alone: always a glyph + label", () => {
    const { container } = render(<StatusPill tone="danger">Voided</StatusPill>);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("Voided")).toBeInTheDocument();
  });
});
