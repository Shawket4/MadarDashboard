import { describe, expect, it } from "vitest";

import { buildHandoffFiles, handoffFilename, type HandoffInput } from "./handoff-content";
import { basicAuthHeader } from "./util";

const input = (over: Partial<HandoffInput> = {}): HandoffInput => ({
  label: "Rue — One Ninety",
  username: "rue-one-ninety-k7m2",
  secret: "s3cret-partner-token",
  branchName: "One Ninety",
  issuedAt: new Date("2026-08-04T09:30:00Z"),
  mode: "created",
  ...over,
});

const fileNamed = (files: { name: string; text: string }[], name: string) =>
  files.find((f) => f.name === name)!;

describe("buildHandoffFiles", () => {
  it("emits exactly README.txt and credentials.txt, both ASCII-named", () => {
    const files = buildHandoffFiles(input());
    expect(files.map((f) => f.name)).toEqual(["README.txt", "credentials.txt"]);
    for (const f of files) {
      // Entry names must survive every unzip tool, so no Arabic may leak in
      // from the label or branch name.
      expect(f.name).toMatch(/^[\x20-\x7E]+$/);
    }
  });

  it("keeps the secret out of the README", () => {
    // The split is the whole point: a regression that leaked the password into
    // the guide would otherwise be invisible.
    const files = buildHandoffFiles(input());
    expect(fileNamed(files, "README.txt").text).not.toContain("s3cret-partner-token");
    expect(fileNamed(files, "credentials.txt").text).toContain("s3cret-partner-token");
  });

  it("emits an Authorization line identical to basicAuthHeader", () => {
    const i = input();
    const text = fileNamed(buildHandoffFiles(i), "credentials.txt").text;
    // Asserted against the real function so the two can never drift apart.
    expect(text).toContain(basicAuthHeader(i.username, i.secret));
  });

  it("uses CRLF line endings and no BOM", () => {
    for (const f of buildHandoffFiles(input())) {
      expect(f.text.startsWith("﻿")).toBe(false);
      expect(f.text).toContain("\r\n");
      // No bare LF anywhere — Notepad would render the file as one long line.
      expect(f.text.replace(/\r\n/g, "")).not.toContain("\n");
    }
  });

  it("carries non-ASCII label and branch name through the body intact", () => {
    const files = buildHandoffFiles(
      input({ label: "رو — وان ناينتي", branchName: "وان ناينتي" }),
    );
    expect(fileNamed(files, "credentials.txt").text).toContain("وان ناينتي");
    expect(files.map((f) => f.name)).toEqual(["README.txt", "credentials.txt"]);
  });

  it("distinguishes a rotation from a first issue", () => {
    const created = fileNamed(buildHandoffFiles(input({ mode: "created" })), "README.txt").text;
    const rotated = fileNamed(buildHandoffFiles(input({ mode: "rotated" })), "README.txt").text;
    expect(created).not.toBe(rotated);
    expect(rotated).toMatch(/REPLACEMENT password/);
    expect(rotated).toMatch(/previous password stopped/);
  });
});

describe("handoffFilename", () => {
  it("stamps the date and sanitises the username", () => {
    expect(handoffFilename("rue-one-ninety-k7m2", new Date("2026-08-04T09:30:00Z"))).toBe(
      "madar-credentials-rue-one-ninety-k7m2-2026-08-04.zip",
    );
  });

  it("never lets non-ASCII or path characters into a filename", () => {
    const name = handoffFilename("وان/ناينتي..\\x", new Date("2026-08-04T00:00:00Z"));
    expect(name).toMatch(/^madar-credentials-[a-z0-9-]*-2026-08-04\.zip$/);
    expect(name).not.toMatch(/[/\\]/);
  });
});
