import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { APP_KEYS, APPS, downloadsHref } from "@shared/apps";
import { APP_QR } from "@shared/apps-qr";

const i18n = (await import("@/i18n")).default;
const { AppCard, StoreBadges } = await import("./apps");

describe("the apps", () => {
  it.each(APP_KEYS.flatMap((app) => (["en", "ar"] as const).map((lang) => [app, lang] as const)))(
    "%s (%s): the QR code is today's downloads page, so a camera opens the right one",
    (app, lang) => {
      const qr = APP_QR[app][lang];
      expect(qr.url).toBe(downloadsHref(lang, app));
      // A QR is 21 + 4k modules square, and every dark run sits inside it.
      expect((qr.size - 21) % 4).toBe(0);
      for (const [, x, y, n] of qr.d.matchAll(/M(\d+) (\d+)h(\d+)/g)) {
        expect(Number(x) + Number(n)).toBeLessThanOrEqual(qr.size);
        expect(Number(y)).toBeLessThan(qr.size);
      }
    },
  );

  it("shows a store's badge only where the app is listed", () => {
    for (const app of APP_KEYS) {
      const { container, unmount } = render(<StoreBadges app={app} />);
      expect(container.querySelectorAll("a").length).toBe([APPS[app].appStore, APPS[app].googlePlay].filter(Boolean).length);
      unmount();
    }
  });

  it("a card has the app, its QR, its badge and every other build, in Arabic too", async () => {
    await i18n.changeLanguage("ar");
    render(<AppCard app="cashier" />);
    expect(screen.getByRole("img", { name: "رمز QR: تنزيل Madar Cashier" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /App Store/ })).toHaveAttribute("href", APPS.cashier.appStore);
    expect(screen.getByRole("link", { name: /تنزيلات أندرويد/ })).toHaveAttribute("href", downloadsHref("ar", "cashier"));
    await i18n.changeLanguage("en");
  });
});
