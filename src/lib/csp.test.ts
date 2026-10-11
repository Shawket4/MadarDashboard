/**
 * Every page carries the Content-Security-Policy (deploy/nginx/README.md,
 * CLAUDE.md "Content-Security-Policy"). In nginx a location with an add_header
 * of its own inherits none of the server's, so the rule is structural: wherever
 * a vhost includes the security headers snippet, the CSP snippet follows.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const nginx = join(process.cwd(), "deploy/nginx");
const policyOf = (snippet: string) =>
  readFileSync(join(nginx, snippet), "utf8").match(/add_header Content-Security-Policy(?:-Report-Only)? "([^"]*)"/)?.[1];

describe("the Content-Security-Policy", () => {
  it("follows the security headers wherever a vhost includes them", () => {
    const vhosts = readdirSync(nginx).filter((f) => f.includes("madar-pos.cloud"));
    expect(vhosts.length).toBeGreaterThan(0);
    for (const f of vhosts) {
      const lines = readFileSync(join(nginx, f), "utf8").split("\n");
      lines.forEach((line, i) => {
        if (!line.includes("include snippets/madar-security-headers.conf;")) return;
        // demo serves the dashboard's demo bundle; it carries no security snippet today.
        expect(lines[i + 1], `${f}:${i + 2}`).toMatch(/include snippets\/madar-csp-(public|dashboard)\.conf;/);
      });
      // Never a hand-copied policy: the snippet is the one place it lives.
      expect(lines.some((l) => l.includes("add_header Content-Security-Policy")), f).toBe(false);
    }
  });

  it("is the same policy in get's service worker as in nginx", () => {
    const sw = readFileSync(join(process.cwd(), "site/sw/sw.ts"), "utf8");
    expect(sw).toContain(`"${policyOf("madar-csp-public.conf")}"`);
  });

  it("reports the dashboard's violations without blocking them, for now", () => {
    const s = readFileSync(join(nginx, "madar-csp-dashboard.conf"), "utf8");
    expect(s).toMatch(/Content-Security-Policy-Report-Only/);
    expect(policyOf("madar-csp-dashboard.conf")).toMatch(/report-uri https:\/\/sentry\.madar-pos\.cloud\//);
  });
});
