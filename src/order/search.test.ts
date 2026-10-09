import { parseSearchWith } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { orderSearchSchema } from "./search";

// What the router hands the schema: the query string, JSON-parsed per value.
const parse = (qs: string) => orderSearchSchema.parse(parseSearchWith(JSON.parse)(qs));

describe("orderSearchSchema", () => {
  it("reads every spelling of preview a link carries", () => {
    for (const qs of ["?preview=1", "?preview=true", '?preview="1"']) {
      expect(parse(qs).preview).toBe(true);
    }
  });

  it("treats anything else as no preview, rather than failing the page", () => {
    for (const qs of ["", "?preview=0", "?preview=false", "?preview=yes"]) {
      expect(parse(qs).preview).toBeUndefined();
    }
  });

  it("keeps a numeric floor or unit as text", () => {
    const s = parse("?floor=2&unit_number=14");
    expect(s.floor).toBe("2");
    expect(s.unit_number).toBe("14");
  });
});
