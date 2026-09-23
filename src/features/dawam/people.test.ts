import { describe, expect, it } from "vitest";
import { cellValue, parsePeople, readCsv } from "./people";

const branches = [{ id: "b1", name: "Zamalek" }, { id: "b2", name: "Maadi" }];

describe("employee import (DSH-7)", () => {
  it("reads English or Arabic headers, canonical phones and salaries in piastres", () => {
    const { people, errors } = parsePeople(
      [
        ["الاسم", "رقم الواتساب", "الفرع", "الراتب"],
        ["Sara Ahmed", "0100 123 4567", "zamalek", "9,000"],
        ["Omar", "+20 101 234 5678", "Maadi", ""],
      ],
      branches,
    );
    expect(errors).toEqual([]);
    expect(people).toEqual([
      { row: 2, name: "Sara Ahmed", phone: "201001234567", branchId: "b1", salaryPiastres: 900_000 },
      { row: 3, name: "Omar", phone: "201012345678", branchId: "b2", salaryPiastres: null },
    ]);
  });

  it("names every row it can't read, and skips blank ones", () => {
    const { people, errors } = parsePeople(
      [
        ["Name", "WhatsApp", "Branch", "Salary"],
        ["", "01001234567", "Zamalek", "1"],
        ["A", "12345", "Zamalek", "1"],
        ["B", "01001234567", "Nowhere", "1"],
        ["C", "01001234567", "Zamalek", "-5"],
        ["", "", "", ""],
        ["D", "01001234567", "Zamalek", "100"],
        ["E", "0100 123 4567", "Zamalek", "100"],
      ],
      branches,
    );
    expect(errors.map((e) => [e.row, e.key])).toEqual([
      [2, "importNoName"], [3, "importBadPhone"], [4, "importNoBranch"], [5, "importBadSalary"], [8, "importDuplicatePhone"],
    ]);
    expect(people.map((p) => p.name)).toEqual(["D"]);
  });

  it("a salary of 0 is refused, as in the Add dialog", () => {
    const { people, errors } = parsePeople([["Name", "Phone", "Salary"], ["A", "01001234567", "0"]], [branches[0]]);
    expect(people).toEqual([]);
    expect(errors.map((e) => e.key)).toEqual(["importBadSalary"]);
  });

  it("reads rich-text, link, formula and date cells as what they show", () => {
    expect(cellValue({ richText: [{ text: "Sara " }, { text: "Ahmed" }] })).toBe("Sara Ahmed");
    expect(cellValue({ text: "0100 123 4567", hyperlink: "tel:01001234567" })).toBe("0100 123 4567");
    expect(cellValue({ formula: "A1*2", result: 9000 })).toBe(9000);
    expect(cellValue({ text: { richText: [{ text: "Zamalek" }] } })).toBe("Zamalek");
    expect(cellValue(new Date("2026-09-01T00:00:00Z"))).toBe("2026-09-01");
    expect(cellValue(42)).toBe(42);
    expect(cellValue(null)).toBeNull();
    const { people } = parsePeople(
      [["Name", "Phone", "Salary"], [cellValue({ richText: [{ text: "Sara" }] }), "01001234567", cellValue({ formula: "x", result: 9000 })]],
      [branches[0]],
    );
    expect(people[0]).toMatchObject({ name: "Sara", salaryPiastres: 900_000 });
  });

  it("uses the only branch when the sheet has no branch column", () => {
    const { people } = parsePeople([["Name", "Phone"], ["A", "01001234567"]], [branches[0]]);
    expect(people[0].branchId).toBe("b1");
  });

  it("reads CSV with quoted commas", () => {
    expect(readCsv('Name,Salary\r\n"Ahmed, Jr",9000\n')).toEqual([["Name", "Salary"], ["Ahmed, Jr", "9000"]]);
  });
});
