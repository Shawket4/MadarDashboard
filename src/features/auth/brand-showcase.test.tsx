import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import "@/i18n";
import { BrandShowcase } from "./brand-showcase";

/**
 * The sign-in panel's picture decides between the 3D showcase and the 2D orbit
 * before it downloads anything. These pin the decisions that keep the page
 * light and safe: nothing at all where the panel is hidden (phones), and the
 * 2D orbit where WebGL isn't there (jsdom has none) or motion is reduced, so
 * the 3D chunk is never requested in those cases.
 */

function mockMedia(matching: string[]) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matching.includes(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BrandShowcase", () => {
  it("draws nothing below the desktop width, where the brand panel is hidden", () => {
    mockMedia([]);
    const { container } = render(<BrandShowcase />);
    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to the 2D orbit when WebGL isn't available", () => {
    mockMedia(["(min-width: 1024px)"]);
    render(<BrandShowcase />);
    for (const part of ["Till", "Kitchen", "Dashboard", "Ordering", "Rewards", "Dawam"]) {
      expect(screen.getByText(part)).toBeInTheDocument();
    }
  });

  it("keeps to the 2D orbit under reduced motion, even with WebGL", () => {
    mockMedia(["(min-width: 1024px)", "(prefers-reduced-motion: reduce)"]);
    vi.stubGlobal("WebGLRenderingContext", function WebGLRenderingContext() {});
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
    render(<BrandShowcase />);
    expect(screen.getByText("Dawam")).toBeInTheDocument();
    // Decided on motion alone: it never even probed for a GPU.
    expect(getContext).not.toHaveBeenCalled();
    getContext.mockRestore();
  });
});
