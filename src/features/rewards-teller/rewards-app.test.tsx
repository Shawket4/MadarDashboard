import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

const i18n = (await import("@/i18n")).default;
const { RewardsApp } = await import("./rewards-app");

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("the Rewards teller page's tab title", () => {
  it("follows the language: English, then Arabic", async () => {
    await i18n.changeLanguage("en");
    render(<RewardsApp />);
    await waitFor(() => expect(document.title).toBe("Rewards by Madar"));
    await i18n.changeLanguage("ar");
    await waitFor(() => expect(document.title).toBe("مكافآت من مدار"));
  });
});
