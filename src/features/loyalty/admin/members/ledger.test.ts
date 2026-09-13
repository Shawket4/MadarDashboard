import { describe, expect, it } from "vitest";
import type { TFunction } from "i18next";

import { ledgerActor, ledgerLabel, ledgerTone, reversedIds, signed } from "./ledger";

const t = ((_k: string, d: string) => d) as unknown as TFunction;

describe("reading the ledger", () => {
  it.each([
    [{ kind: "earn", source: "sale" }, "Earned on a sale", "earn"],
    [{ kind: "redeem", source: "redemption" }, "Reward redeemed", "spend"],
    [{ kind: "reverse_earn", source: "void" }, "Earn reversed (void)", "reversal"],
    [{ kind: "reverse_redeem", source: "void" }, "Reward returned (void)", "reversal"],
    [{ kind: "reverse_earn", source: "refund" }, "Refund clawback", "reversal"],
    [{ kind: "adjust", source: "manual" }, "Manual adjustment", "manual"],
    [{ kind: "adjust", source: "birthday" }, "Birthday gift", "gift"],
    [{ kind: "adjust", source: "winback" }, "Win-back gift", "gift"],
  ])("labels %o", (row, label, tone) => {
    expect(ledgerLabel(row, t)).toBe(label);
    expect(ledgerTone(row)).toBe(tone);
  });

  it("knows which rows a reversal undid", () => {
    const ids = reversedIds([{ reverses_id: null }, { reverses_id: "a" }, { reverses_id: undefined }]);
    expect([...ids]).toEqual(["a"]);
  });

  it("signs amounts with a real minus", () => {
    expect(signed(5)).toBe("+5");
    expect(signed(-5)).toBe("−5");
    expect(signed(0)).toBe("0");
  });
});

describe("who wrote a ledger row", () => {
  const tr = ((_k: string, o: string | { defaultValue: string; name: string }) =>
    typeof o === "string" ? o : o.defaultValue.replace("{{name}}", o.name)) as unknown as TFunction;
  it("names the person, or says the system did it", () => {
    expect(ledgerActor({ created_by: "u-1", created_by_name: "Mona" }, tr)).toBe("by Mona");
    expect(ledgerActor({ created_by: null, created_by_name: null }, tr)).toBe("automatic");
  });
});
