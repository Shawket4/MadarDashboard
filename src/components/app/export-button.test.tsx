import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const shakes: unknown[] = [];
vi.mock("@/lib/motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/motion")>()),
  useShake: (_ref: unknown, signal: unknown) => void shakes.push(signal),
}));

import { ExportButton } from "./export-button";

describe("ExportButton", () => {
  it("shakes when the export rejects, and swallows the rejection", async () => {
    shakes.length = 0;
    const onExport = vi.fn().mockRejectedValue(new Error("disk full"));
    render(<ExportButton onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    await waitFor(() => expect(shakes.at(-1)).toBe(1));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("stays still when the export succeeds", async () => {
    shakes.length = 0;
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(<ExportButton onExport={onExport} />);
    fireEvent.click(screen.getByRole("button", { name: /Export/ }));
    await waitFor(() => expect(onExport).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(shakes.every((s) => s === 0)).toBe(true);
  });
});
