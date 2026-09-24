/**
 * A reason the SERVER wrote comes with a code and is worded in the reader's
 * language (AT-13); a person's own words (no code) are shown as typed.
 */
import { describe, expect, it } from "vitest";

const i18n = (await import("@/i18n")).default;
const { auditReasonText, auditCols } = await import("./audit-tab");

describe("auditReasonText", () => {
  it("words server codes and keeps people's own words (E2E L-34)", async () => {
    await i18n.changeLanguage("ar");
    const t = i18n.t.bind(i18n);
    expect(auditReasonText(t, { label: "Approved punch correction request", code: "correction_request" })).not.toMatch(/[A-Za-z]/);
    expect(auditReasonText(t, { label: "unspecified", code: "unspecified" })).not.toMatch(/unspecified/);
    expect(auditReasonText(t, { label: "wrong_order", code: "wrong_order" })).toBe(t("orders.voidReasons.wrong_order"));
    expect(auditReasonText(t, { label: "Broken glassware", code: null })).toBe("Broken glassware");
    expect(auditReasonText(t, { label: "some_new_code", code: "some_new_code" })).toBe("some_new_code");
    await i18n.changeLanguage("en");
  });

  it("names the export columns in the reader's language", async () => {
    await i18n.changeLanguage("ar");
    const headers = auditCols(i18n.t.bind(i18n), "money").map((c) => c.header);
    expect(headers.join(" ")).not.toMatch(/Label|Events|Amount/);
    await i18n.changeLanguage("en");
  });

  it("words the deduction-override types the server sends without a code (E2E payroll, Legal ▸ Deduction overrides)", async () => {
    const t = i18n.t.bind(i18n);
    await i18n.changeLanguage("ar");
    expect(auditReasonText(t, { label: "waived", code: null })).not.toMatch(/waived/);
    expect(auditReasonText(t, { label: "overridden", code: null })).not.toMatch(/overridden/);
    await i18n.changeLanguage("en");
    expect(auditReasonText(t, { label: "waived", code: null })).toBe("Waived");
    expect(auditReasonText(t, { label: "overridden", code: "overridden" })).toBe("Overridden");
  });

  it("counts events with the right plural form", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("reports.legal.eventsCount", { count: 1, n: "1" })).toBe("1 event");
    expect(i18n.t("reports.legal.eventsCount", { count: 4, n: "4" })).toBe("4 events");
    await i18n.changeLanguage("ar");
    expect(i18n.t("reports.legal.eventsCount", { count: 3, n: "3" })).toBe("3 أحداث");
    expect(i18n.t("reports.legal.eventsCount", { count: 1, n: "1" })).toBe("حدث واحد");
    await i18n.changeLanguage("en");
  });
});
