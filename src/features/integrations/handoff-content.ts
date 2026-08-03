/**
 * The text files that go inside the encrypted handoff archive.
 *
 * Deliberately NOT internationalised. `t()` resolves against the *operator's*
 * language, but the reader here is the partner's engineer — an Arabic dashboard
 * must not produce an Arabic integration spec for a third party. English only.
 *
 * Line endings are CRLF and there is no BOM: the partner may well open these in
 * Windows Notepad, which renders bare LF as one unbroken line.
 */

import { analyticsUrl, basicAuthHeader } from "./util";

export interface HandoffFile {
  /** ASCII-only — entry names must survive every unzip tool. */
  name: string;
  text: string;
}

export interface HandoffInput {
  /** Operator-facing label, e.g. "Rue — One Ninety". May be non-ASCII. */
  label: string;
  username: string;
  secret: string;
  /** May be non-ASCII. */
  branchName: string;
  issuedAt: Date;
  mode: "created" | "rotated";
}

const crlf = (lines: string[]) => `${lines.join("\r\n")}\r\n`;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** `Rue — One Ninety` → `rue-one-ninety`, safe for a filename on any OS. */
const slug = (raw: string) =>
  raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export function handoffFilename(username: string, issuedAt: Date): string {
  const base = slug(username) || "partner";
  return `madar-credentials-${base}-${isoDate(issuedAt)}.zip`;
}

function credentialsText(input: HandoffInput): string {
  const endpoint = analyticsUrl();
  return crlf([
    "MADAR ANALYTICS API - CREDENTIALS",
    "=================================",
    "",
    `Issued for : ${input.label}`,
    `Branch     : ${input.branchName}`,
    `Issued on  : ${input.issuedAt.toISOString()}`,
    "",
    "Username   : " + input.username,
    "Password   : " + input.secret,
    "",
    "Endpoint",
    "--------",
    endpoint,
    "",
    "(from and to are placeholders - replace with real dates, see README.txt)",
    "",
    "Authorization header",
    "--------------------",
    basicAuthHeader(input.username, input.secret),
    "",
    "Quick test",
    "----------",
    `curl -u '${input.username}:${input.secret}' \\`,
    `  '${endpoint.replace(/YYYY-MM-DD/g, "2026-08-04")}'`,
    "",
    "Keep this file private. Do not commit it to source control.",
  ]);
}

function readmeText(input: HandoffInput): string {
  const endpoint = analyticsUrl();
  return crlf([
    "MADAR ANALYTICS API - INTEGRATION GUIDE",
    "=======================================",
    "",
    input.mode === "rotated"
      ? "This archive contains a REPLACEMENT password. The previous password stopped"
      : "This archive contains new credentials for the Madar Analytics API.",
    input.mode === "rotated"
      ? "working the moment this one was issued. Your credentials are in credentials.txt."
      : "Your credentials are in credentials.txt.",
    "",
    "Live from 4 August 2026.",
    "",
    "",
    "1. ENDPOINT",
    "-----------",
    "GET " + endpoint.split("?")[0],
    "",
    "",
    "2. DATE RANGE",
    "-------------",
    "Two query parameters, both plain calendar dates (YYYY-MM-DD), both INCLUSIVE:",
    "",
    "  from    required   First business day to include.",
    "  to      required   Last business day to include.",
    "  limit   optional   Page size, max 5000. Omit for the whole window.",
    "  offset  optional   Row offset, used with limit. Defaults to 0.",
    "",
    "There is no branch parameter. The branch is determined by the credentials you",
    "authenticate with, so there is nothing for you to pass. The branch it resolved",
    "to comes back in the response as branch_id / branch_name.",
    "",
    "Dates are resolved in the branch's own timezone (Africa/Cairo), not UTC. Send",
    "from=2026-06-01&to=2026-06-30 and you get all of June as the branch experienced",
    "it - we handle the UTC offset and Egypt's daylight-saving switch, so there is",
    "nothing for you to compute. The response echoes the exact instant window it",
    "applied (from_utc / to_utc), so coverage is never ambiguous.",
    "",
    "Example:",
    "  " + endpoint.replace(/YYYY-MM-DD/g, "2026-06-01").replace("to=2026-06-01", "to=2026-06-30"),
    "",
    "",
    "3. AUTHENTICATION - HTTP BASIC",
    "------------------------------",
    "  Authorization: Basic base64(username:password)",
    "",
    "Over HTTPS only. The credentials are read-only, scoped to a single branch, and",
    "can be rotated or revoked at any time without affecting anything else.",
    "",
    "",
    "4. RESPONSE - JSON",
    "------------------",
    "All monetary values are integers in PIASTRES (1 EGP = 100 piastres).",
    "",
    "{",
    '  "branch_id": "...",',
    '  "branch_name": "...",',
    '  "timezone": "Africa/Cairo",',
    '  "from": "2026-06-01",',
    '  "to": "2026-06-30",',
    '  "from_utc": "2026-05-31T21:00:00Z",',
    '  "to_utc": "2026-06-30T21:00:00Z",',
    '  "total_orders": 0,',
    '  "subtotal": 0,',
    '  "total_discount": 0,',
    '  "total_tax": 0,',
    '  "total_service_charge": 0,',
    '  "total_revenue": 0,',
    '  "avg_order_total": 0,',
    '  "limit": null,',
    '  "offset": 0,',
    '  "returned": 0,',
    '  "orders": [',
    "    {",
    '      "order_id": "...",',
    '      "order_number": 0,',
    '      "order_ref": "ONE190-260601-0001",',
    '      "status": "completed",',
    '      "business_date": "2026-06-01",',
    '      "created_at": "2026-06-01T12:00:00Z",',
    '      "subtotal": 0,',
    '      "discount_amount": 0,',
    '      "tax_amount": 0,',
    '      "service_charge": 0,',
    '      "total_amount": 0',
    "    }",
    "  ]",
    "}",
    "",
    "",
    "5. FIELD SEMANTICS",
    "------------------",
    "total_amount is subtotal - discount_amount + tax_amount. That identity holds on",
    "every row, so you can reconcile arithmetically.",
    "",
    "service_charge is always 0.",
    "",
    "business_date is the order's calendar day in the branch's timezone. It is",
    "derived the same way as the YYMMDD segment inside order_ref, so the two always",
    "agree - useful when reconciling a specific receipt.",
    "",
    "order_ref is the human-readable reference printed on the customer's receipt",
    "(<BRANCHCODE>-<YYMMDD>-<NNNN>), unique across the whole organization. It is the",
    "best key for looking up a disputed order. It may be null on a small number of",
    "legacy orders that predate the scheme.",
    "",
    "avg_order_total is total_revenue / total_orders, truncated to whole piastres,",
    "and 0 when the window is empty.",
    "",
    "",
    "6. PAGINATION",
    "-------------",
    "Optional today: omit limit and you get the entire window in one response.",
    "total_orders always reflects the whole window regardless of paging, so you can",
    "page with limit + offset and still trust the aggregates on every page. Row order",
    "is stable (created_at, then order_id).",
    "",
    "Please build your client to handle paging from day one. As order volume grows we",
    "may need to make limit mandatory with a default page size. If your client",
    "already reads returned / total_orders and follows offset, that change will be",
    "transparent to you. If it assumes one response contains everything, it will",
    "silently truncate.",
    "",
    "",
    "7. ERRORS",
    "---------",
    'Standard HTTP status codes with a JSON body of the form {"error": "..."}.',
    "",
    "  400   Bad parameters (e.g. from after to, limit < 1)",
    "  401   Missing, malformed, wrong, or revoked credentials",
    "  429   Rate limited - 30 requests/minute per IP",
    "",
    "",
    "8. HANDLING THESE CREDENTIALS",
    "-----------------------------",
    "Store the password in your secret manager, not in source control. If you believe",
    "it has been exposed, tell us and we will rotate it - rotation is instant and",
    "does not require re-doing the integration, only updating the password.",
    "",
    "Do not forward this archive's password over the same channel you received the",
    "archive itself.",
  ]);
}

export function buildHandoffFiles(input: HandoffInput): HandoffFile[] {
  return [
    { name: "README.txt", text: readmeText(input) },
    { name: "credentials.txt", text: credentialsText(input) },
  ];
}
