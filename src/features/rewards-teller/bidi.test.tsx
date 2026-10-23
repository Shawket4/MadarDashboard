import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import i18n from "@/i18n";

import { isolate, tNames } from "./bidi";
import { MemberCard } from "./member-card";
import { cardColors } from "./util";

afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("names inside sentences", () => {
  it("puts a Latin name in an Arabic question inside <bdi>, so the ؟ stays after it", async () => {
    await i18n.changeLanguage("ar");
    const t = i18n.getFixedT("ar");
    const { container } = render(
      <p>{tNames(t, "rewardsTeller.giftConfirmTitle", { name: "Laila Mostafa" }, ["name"])}</p>,
    );
    expect(container.querySelector("p")!.innerHTML).toBe("تسليم هدية عيد ميلاد <bdi>Laila Mostafa</bdi>؟");
  });

  it("isolates every name the confirms and notices interpolate", async () => {
    await i18n.changeLanguage("ar");
    const t = i18n.getFixedT("ar");
    for (const key of [
      "rewardsTeller.confirmStampsBody",
      "rewardsTeller.confirmRedeemTitle",
      "rewardsTeller.giftConfirmTitle",
      "rewardsTeller.giftGivenBody",
      "rewardsTeller.nowHas",
    ]) {
      const { container, unmount } = render(<p>{tNames(t, key, { name: "Omar Adel", count: 3, have: 5, size: 8 }, ["name"])}</p>);
      expect(container.querySelector("bdi")?.textContent, key).toBe("Omar Adel");
      unmount();
    }
  });

  it("keeps names apart from figures and isolates them in labels", () => {
    expect(isolate("Omar Adel")).toBe("⁨Omar Adel⁩");
    const { container } = render(
      <MemberCard
        shopName="Drops Coffee"
        name="Omar Adel"
        phone="201001234567"
        tracks={[
          { id: "a", name: "Coffee", filled: 2, size: 6, extra: 0, canRedeem: true },
          { id: "b", name: "Pastry", filled: 1, size: 4, extra: 0, canRedeem: false },
        ]}
        colors={cardColors(null)}
        onRedeem={() => {}}
      />,
    );
    const bdis = [...container.querySelectorAll("bdi")].map((b) => b.textContent);
    expect(bdis).toEqual(expect.arrayContaining(["Drops Coffee", "Omar Adel", "Coffee", "Pastry"]));
    expect(container.querySelector("section")!.getAttribute("aria-label")).toBe("⁨Omar Adel⁩'s card");
    // No "rewards by madar" mono line on the teller's card.
    expect(container.querySelector("footer")).toBeNull();
  });
});
