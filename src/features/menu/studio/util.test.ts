/**
 * MENU-STUDIO-065/067/018 (W8): the server answers a preset step's note as the
 * step's own note, else the library's. The studio used to seed the note box
 * with whatever came back, so the next Save wrote the library's wording as the
 * drink's own note. A note equal to the library's now seeds an empty box.
 */
import { describe, expect, it } from "vitest";

import type { RecipeStepPreset, StudioAggregate } from "@/data/api/generated/models";

import { toStepDrafts } from "./util";

const steam = { slug: "steam-milk", name: "Steam milk", name_ar: "تبخير الحليب", note: "Stretch to 60°C", note_ar: "حتى 60 درجة" } as RecipeStepPreset;
const step = (note: string | null, note_ar: string | null) =>
  ({ kind: "preset", preset_slug: "steam-milk", name: "Steam milk", name_ar: "تبخير الحليب", note, note_ar, position: 0, animation_is_global: true });
const studio = (...steps: ReturnType<typeof step>[]) => ({ recipe_steps: steps }) as unknown as StudioAggregate;

describe("toStepDrafts preset notes (W8)", () => {
  it("leaves the box empty when the note is the library's, in each language", () => {
    const [d] = toStepDrafts(studio(step("Stretch to 60°C", "حتى 60 درجة")), [steam]);
    expect(d).toMatchObject({ kind: "preset", note: "", note_ar: "" });
  });

  it("keeps the drink's own note, language by language", () => {
    const [d] = toStepDrafts(studio(step("40ml condensed milk first", "حتى 60 درجة")), [steam]);
    expect(d).toMatchObject({ note: "40ml condensed milk first", note_ar: "" });
  });

  it("keeps what came back while the library is not known yet", () => {
    const [d] = toStepDrafts(studio(step("Stretch to 60°C", null)));
    expect(d).toMatchObject({ note: "Stretch to 60°C", note_ar: "" });
  });

  it("leaves a written step's note alone", () => {
    const [d] = toStepDrafts(
      studio({ ...step("Stretch to 60°C", null), kind: "custom", preset_slug: null } as never),
      [steam],
    );
    expect(d).toMatchObject({ kind: "custom", note: "Stretch to 60°C" });
  });
});
