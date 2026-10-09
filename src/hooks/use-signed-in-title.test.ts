import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

await import("@/i18n");
const { useSignedInTitle } = await import("./use-signed-in-title");

const SIGN_IN = "Madar POS — sign in | مدار";

describe("useSignedInTitle", () => {
  afterEach(() => {
    document.title = "";
  });

  it("leaves the page's own title alone while signed out", () => {
    document.title = SIGN_IN;
    renderHook(() => useSignedInTitle(false));
    expect(document.title).toBe(SIGN_IN);
  });

  it("names the product once signed in, and gives the title back on sign-out", () => {
    document.title = SIGN_IN;
    const { rerender } = renderHook(({ signedIn }) => useSignedInTitle(signedIn), {
      initialProps: { signedIn: true },
    });
    expect(document.title).toBe("Madar POS");
    rerender({ signedIn: false });
    expect(document.title).toBe(SIGN_IN);
  });
});
