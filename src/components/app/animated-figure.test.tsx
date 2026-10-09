import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnimatedFigure } from "./animated-figure";

describe("AnimatedFigure", () => {
  it("shows the figure it is given and swaps to a new one", async () => {
    const { rerender } = render(<AnimatedFigure text="0.050000" />);
    expect(screen.getByText("0.050000")).toBeInTheDocument();

    rerender(<AnimatedFigure text="0.045680" />);
    expect(await screen.findByText("0.045680")).toBeInTheDocument();
    // The old figure fades out and leaves; it never lingers beside the new one.
    await waitFor(() => expect(screen.queryByText("0.050000")).not.toBeInTheDocument());
  });

  it("never shows an in-between value: only the two figures exist", () => {
    const { rerender, container } = render(<AnimatedFigure text="1.000000" />);
    rerender(<AnimatedFigure text="2.000000" />);
    const shown = Array.from(container.querySelectorAll("span span")).map((n) => n.textContent);
    expect(shown.every((t) => t === "1.000000" || t === "2.000000")).toBe(true);
  });
});
