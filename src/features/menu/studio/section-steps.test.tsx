/**
 * MENU-STUDIO-067 (W8): a preset step's note box shows the library's note as
 * its placeholder, so an empty box reads as "the library's wording" and
 * nothing is copied onto the drink.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/api/generated/api", () => ({
  useListStepPresets: () => ({
    data: [{ slug: "steam-milk", name: "Steam milk", name_ar: "تبخير الحليب", note: "Stretch to 60°C", note_ar: "حتى 60 درجة" }],
    isLoading: false,
  }),
}));
vi.mock("./step-preview", () => ({ StepPreview: () => null }));

const i18n = (await import("@/i18n")).default;
await i18n.changeLanguage("en");
const { SectionSteps } = await import("./section-steps");

describe("SectionSteps note boxes (W8)", () => {
  it("a preset step's empty box shows the library note as its placeholder; a written step keeps the hint", () => {
    render(
      <SectionSteps
        setSteps={vi.fn()}
        steps={[
          { kind: "preset", preset_slug: "steam-milk", title: "", title_ar: "", note: "", note_ar: "" },
          { kind: "custom", preset_slug: null, title: "Stir", title_ar: "", note: "", note_ar: "" },
        ]}
      />,
    );
    const [presetEn, customEn] = screen.getAllByLabelText("Note (English)");
    const [presetAr] = screen.getAllByLabelText("Note (Arabic)");
    expect(presetEn).toHaveValue("");
    expect(presetEn).toHaveAttribute("placeholder", "Stretch to 60°C");
    expect(presetAr).toHaveAttribute("placeholder", "حتى 60 درجة");
    expect(customEn).toHaveAttribute("placeholder", "For this drink — e.g. 40ml condensed milk");
  });
});
