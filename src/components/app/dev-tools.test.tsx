/**
 * The devtools' floating launchers never cover a phone-width page (box
 * verify: they sat over Discipline's and Legal's card headers at 390 px).
 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query-devtools", () => ({ ReactQueryDevtools: () => <div data-testid="query-devtools" /> }));
vi.mock("@tanstack/react-router-devtools", () => ({ TanStackRouterDevtools: () => <div data-testid="router-devtools" /> }));

const { DevTools } = await import("./dev-tools");

const setWidth = (w: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: w });
  window.matchMedia = ((q: string) => ({ matches: w < 768, media: q, addEventListener: () => {}, removeEventListener: () => {} })) as never;
};

afterEach(() => setWidth(1024));

describe("DevTools", () => {
  it("shows in development on a wide screen", async () => {
    setWidth(1440);
    const { findByTestId } = render(<DevTools which="query" dev />);
    expect(await findByTestId("query-devtools")).toBeInTheDocument();
  });

  it("stays off a phone-width screen", async () => {
    setWidth(390);
    const { queryByTestId } = render(<><DevTools which="query" dev /><DevTools which="router" dev /></>);
    await new Promise((r) => setTimeout(r, 20));
    expect(queryByTestId("query-devtools")).toBeNull();
    expect(queryByTestId("router-devtools")).toBeNull();
  });

  it("never renders outside development", async () => {
    setWidth(1440);
    const { queryByTestId } = render(<DevTools which="router" dev={false} />);
    await new Promise((r) => setTimeout(r, 20));
    expect(queryByTestId("router-devtools")).toBeNull();
  });
});
