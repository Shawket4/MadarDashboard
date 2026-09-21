import { describe, expect, it } from "vitest";

import { classifyIdentityEdit, defaultIdentityChange } from "./identity-edit";

const known = { name: "Sara Ali", phone: "201001234567" };

describe("classifyIdentityEdit", () => {
  it("asks nothing when nothing about the person changed", () => {
    expect(classifyIdentityEdit(known, { name: "Sara Ali", phone: "01001234567" }).kind).toBe("none");
  });

  it.each([["0100 123 4567"], ["+20 100 123 4567"], ["٠١٠٠١٢٣٤٥٦٧"], ["00201001234567"]])(
    "the same number written as %s is not a change",
    (phone) => {
      expect(classifyIdentityEdit(known, { name: "Sara Ali", phone }).phoneChanged).toBe(false);
    },
  );

  it.each([["sara ali"], ["  Sara   Ali "], ["SARA ALI"]])("the same name written as %j is not a change", (name) => {
    expect(classifyIdentityEdit(known, { name, phone: known.phone }).kind).toBe("none");
  });

  it("a different name alone is a name edit", () => {
    expect(classifyIdentityEdit(known, { name: "Omar Hassan", phone: "01001234567" })).toEqual({
      kind: "name",
      nameChanged: true,
      phoneChanged: false,
    });
  });

  it("a different phone is a phone edit, with or without the name", () => {
    expect(classifyIdentityEdit(known, { name: "Sara Ali", phone: "01112345678" }).kind).toBe("phone");
    expect(classifyIdentityEdit(known, { name: "Omar", phone: "01112345678" })).toEqual({
      kind: "phone",
      nameChanged: true,
      phoneChanged: true,
    });
  });

  it("leaves blanks and non-phones to the form", () => {
    expect(classifyIdentityEdit(known, { name: "", phone: "" }).kind).toBe("none");
    expect(classifyIdentityEdit(known, { name: "Sara Ali", phone: "010012345" }).kind).toBe("none");
  });

  it("asks nothing when nobody is known yet", () => {
    expect(classifyIdentityEdit(null, { name: "Omar", phone: "01112345678" }).kind).toBe("none");
    expect(classifyIdentityEdit({ name: null, phone: null }, { name: "Omar", phone: "01112345678" }).kind).toBe("none");
  });

  it("a known phone without a known name can still change phone, never name", () => {
    const edit = classifyIdentityEdit({ phone: "01001234567" }, { name: "Omar", phone: "01112345678" });
    expect(edit).toEqual({ kind: "phone", nameChanged: false, phoneChanged: true });
  });
});

describe("defaultIdentityChange", () => {
  it("defaults a name edit to the order alone, and a phone edit to nothing", () => {
    expect(defaultIdentityChange("name")).toBe("once");
    expect(defaultIdentityChange("phone")).toBeNull();
    expect(defaultIdentityChange("none")).toBeNull();
  });
});
