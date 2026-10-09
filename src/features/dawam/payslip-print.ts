/**
 * A payslip as a PDF (Dawam PAY-10), with no PDF library: a clean A4 page in
 * its own window, in the reader's language and direction, handed to the
 * browser's print dialog ("Save as PDF"). Every figure is the server's.
 */
import { fmtDate, fmtMoney, fmtMoneySigned } from "@/lib/format";
import type { PayLine } from "./lines";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export interface PayslipDoc {
  company: string;
  period: { start_date: string; end_date: string } | null;
  person: string;
  /** `waivedNote`: the waived line's note ("Waived: <why>"); `labels.waived` otherwise. */
  lines: { label: string; line: PayLine; waivedNote?: string }[];
  net: number;
  /** Deductions past what was earned, carried to the next payslip (PAY-12). */
  carryOut?: number;
  labels: { title: string; period: string; employee: string; net: string; waived: string; carryOut?: string };
  lang: string;
  dir: "ltr" | "rtl";
}

/** The page's HTML. Pure, so it is tested without a window. */
export function payslipHtml(d: PayslipDoc): string {
  const rows = d.lines
    .map(({ label, line, waivedNote }) => {
      const style = line.waived ? ' style="text-decoration:line-through;color:#888"' : "";
      const note = line.waived ? ` <small>(${esc(waivedNote ?? d.labels.waived)})</small>` : "";
      return `<tr${style}><td>${esc(label)}${note}</td><td class="n">${esc(fmtMoneySigned(line.amount))}</td></tr>`;
    })
    .join("");
  const period = d.period ? `${esc(fmtDate(d.period.start_date))} – ${esc(fmtDate(d.period.end_date))}` : "";
  return `<!doctype html><html lang="${esc(d.lang)}" dir="${d.dir}"><head><meta charset="utf-8"><title>${esc(d.labels.title)} · ${esc(d.person)}</title>
<style>
@page{size:A4;margin:18mm}
body{font-family:"IBM Plex Sans Arabic","IBM Plex Sans",system-ui,sans-serif;color:#111;margin:0}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;font-weight:600;margin:0 0 20px;color:#444}
dl{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;margin:0 0 20px}dt{color:#666}dd{margin:0}
table{width:100%;border-collapse:collapse}td{padding:8px 0;border-bottom:1px solid #ddd}
.n{text-align:end;font-variant-numeric:tabular-nums;white-space:nowrap}
tfoot td{border-top:2px solid #111;border-bottom:0;font-weight:700;font-size:16px}
</style></head><body>
<h1>${esc(d.company)}</h1><h2>${esc(d.labels.title)}</h2>
<dl><dt>${esc(d.labels.employee)}</dt><dd>${esc(d.person)}</dd><dt>${esc(d.labels.period)}</dt><dd>${period}</dd></dl>
<table><tbody>${rows}</tbody><tfoot><tr><td>${esc(d.labels.net)}</td><td class="n">${esc(fmtMoney(d.net))}</td></tr>${
    d.carryOut && d.carryOut > 0
      ? `<tr><td>${esc(d.labels.carryOut ?? "")}</td><td class="n">${esc(fmtMoneySigned(-d.carryOut))}</td></tr>`
      : ""
  }</tfoot></table>
</body></html>`;
}

/** Open the page and ask the browser to print it. False when a blocker ate the window. */
export function printPayslip(d: PayslipDoc): boolean {
  const w = window.open("", "_blank");
  if (!w) return false;
  w.document.open();
  w.document.write(payslipHtml(d));
  w.document.close();
  w.focus();
  // Fonts first, so the PDF is not set in a fallback face.
  void (w.document.fonts?.ready ?? Promise.resolve()).then(() => w.print());
  return true;
}
