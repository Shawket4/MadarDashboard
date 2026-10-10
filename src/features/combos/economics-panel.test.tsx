// The editor's minimum-margin tone is madar-money's `margin` (the wasm) of the
// price over each cost, against the owner's minimum.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EconomicsView } from "./economics-panel";
import type { ComboEconomics } from "./types";

const econ = (cost_default: number | null, cost_max: number | null): ComboEconomics => ({
  branch_id: null,
  price: 15000,
  list_default: 16000,
  list_min: 16000,
  list_max: 16000,
  cost_default,
  cost_max,
  margin_default: null,
  margin_worst: null,
  min_margin: "0.5500",
  saving_default: 1000,
  warnings: [],
});

const warned = (label: string) => screen.getByText(label).parentElement!.querySelector("bdi")!.className.includes("--color-warning");

describe("the minimum-margin tone", () => {
  it("warns only under the minimum: 15,000 at a cost of 6,750 is 55 % exactly, 6,751 is under", () => {
    render(<EconomicsView econ={econ(6750, 6751)} names={{}} />);
    expect(warned("Margin (default picks)")).toBe(false);
    expect(warned("Margin (costliest picks)")).toBe(true);
  });

  it("an unknown cost has no margin to warn about", () => {
    render(<EconomicsView econ={econ(null, null)} names={{}} />);
    expect(warned("Margin (default picks)")).toBe(false);
  });
});
