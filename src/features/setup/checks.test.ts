import { describe, expect, it } from "vitest";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";
import model from "@/data/api/generated/models/readinessCheck.ts?raw";
import type { Readiness, ReadinessCheck } from "@/data/api/generated/models";

import { CHECKS, known, leftToDo, nextCheck, problemLink, showsHomeCard, stageOf } from "./checks";

const check = (key: string, level: "blocking" | "advice", ok: boolean, extra: Partial<ReadinessCheck> = {}): ReadinessCheck => ({
  key, level, ok, count: ok ? 0 : 1, problems: [], more: 0, ...extra,
});
const readiness = (checks: ReadinessCheck[], live = false): Readiness => ({
  org_id: "o1",
  ready: checks.every((c) => c.ok || c.level === "advice"),
  live,
  first_order_at: live ? "2026-10-19T09:00:00Z" : null,
  checks,
});

describe("every check the server can send", () => {
  // The keys the server documents on ReadinessCheck.key (MadarRust orgs/readiness.rs),
  // read from the generated model so a new server key fails here until it has words.
  const serverKeys = [...model.slice(model.indexOf("Stable key"), model.indexOf("key: string")).matchAll(/`([a-z_]+)`/g)].map((m) => m[1]);

  it("is documented by the server (the list this test reads)", () => {
    expect(serverKeys).toContain("tablet");
    expect(serverKeys.length).toBeGreaterThanOrEqual(13);
  });

  it.each(serverKeys)("%s has an icon, a page and words in English and Arabic", (key) => {
    expect(CHECKS[key], key).toBeDefined();
    for (const [lang, d] of [["en", en], ["ar", ar]] as const) {
      const c = (d.setup.checks as Record<string, Record<string, string>>)[key];
      expect(c, `${lang}:${key}`).toBeDefined();
      for (const part of ["title", "action", "ok", "todo"]) {
        // A counted sentence is plural forms only (`todo_one`, `todo_other`, …).
        expect(c[part] ?? c[`${part}_other`], `${lang}:${key}.${part}`).toBeTruthy();
      }
    }
  });

  it("Arabic gives every counted sentence all six plural forms", () => {
    for (const [key, c] of Object.entries(ar.setup.checks as Record<string, Record<string, string>>)) {
      for (const part of ["ok", "todo"]) {
        if (!c[`${part}_other`]) continue;
        for (const form of ["zero", "one", "two", "few", "many", "other"]) expect(c[`${part}_${form}`], `${key}.${part}_${form}`).toBeTruthy();
      }
    }
  });

  it("an unknown key from a newer server is skipped, not drawn blank", () => {
    expect(known([check("branch", "blocking", true), check("from_the_future", "blocking", false)]).map((c) => c.key)).toEqual(["branch"]);
  });
});

describe("the setup's stage", () => {
  const fresh = readiness([check("branch", "blocking", true), check("menu", "blocking", false), check("tablet", "blocking", false), check("team", "advice", false)]);

  it("is setting up while a blocking check fails, with the first one next", () => {
    expect(stageOf(fresh)).toBe("setup");
    expect(leftToDo(fresh)).toBe(2);
    expect(nextCheck(fresh)?.key).toBe("menu");
    expect(showsHomeCard(fresh)).toBe(true);
  });

  it("is ready once only advice is open, and the card stays until the first sale", () => {
    const ready = readiness([check("branch", "blocking", true), check("team", "advice", false)]);
    expect(stageOf(ready)).toBe("ready");
    expect(showsHomeCard(ready)).toBe(true);
    const live = readiness([check("branch", "blocking", true), check("team", "advice", false)], true);
    expect(stageOf(live)).toBe("live");
    expect(showsHomeCard(live)).toBe(false);
  });

  it("brings the card back when a live shop breaks the till again", () => {
    expect(showsHomeCard(readiness([check("tablet", "blocking", false)], true))).toBe(true);
  });

  it("has nothing to show for an org without the POS", () => {
    expect(stageOf(readiness([]))).toBe("none");
    expect(showsHomeCard(readiness([]))).toBe(false);
    expect(stageOf(undefined)).toBe("none");
  });
});

describe("a named problem opens its own editor", () => {
  const p = { entity_id: "x", name: "n", rule: null, message: null, group_id: null } as const;
  it.each([
    [{ ...p, entity_type: "item", item_id: "i1" }, { to: "/menu/items/$itemId", params: { itemId: "i1" } }],
    [{ ...p, entity_type: "attachment", item_id: "i2", group_id: "g1" }, { to: "/menu/items/$itemId", params: { itemId: "i2" } }],
    [{ ...p, entity_type: "branch", item_id: null }, { to: "/branches" }],
    [{ ...p, entity_type: "ingredient", item_id: null }, { to: "/inventory/ingredients" }],
    [{ ...p, entity_type: "option", item_id: null }, { to: "/menu/groups" }],
  ])("%o", (problem, link) => {
    expect(problemLink(problem)).toEqual(link);
  });
});
