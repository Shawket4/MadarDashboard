/**
 * Adding employees in bulk (Dawam DSH-7): a spreadsheet of name, WhatsApp
 * number, branch and salary becomes one user + employment profile per row.
 * The server checks everything again; this reads the sheet, matches branches
 * by name, and says which rows can't be read before anything is created.
 */
import { canonicalPhone } from "@/lib/phone";
import { egpToPiastres } from "@/lib/format";

export interface NewPerson {
  row: number;
  name: string;
  phone: string; // canonical (201…)
  branchId: string;
  salaryPiastres: number | null;
}

export interface RowError {
  row: number;
  /** i18n key under `dawam.` */
  key: "importNoName" | "importBadPhone" | "importNoBranch" | "importBadSalary" | "importDuplicatePhone";
  value?: string;
}

/** Column headers we understand, in English and Arabic. */
const COLUMNS: Record<keyof Omit<NewPerson, "row" | "phone" | "branchId" | "salaryPiastres"> | "phone" | "branch" | "salary", string[]> = {
  name: ["name", "full name", "employee", "الاسم", "اسم الموظف"],
  phone: ["whatsapp", "phone", "mobile", "whatsapp number", "رقم الواتساب", "الموبايل", "الهاتف", "رقم الهاتف"],
  branch: ["branch", "الفرع"],
  salary: ["salary", "monthly salary", "الراتب", "المرتب"],
};

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

/** Rows as read from a sheet (first row = headers) → people and problems. */
export function parsePeople(
  rows: unknown[][],
  branches: { id: string; name: string }[],
): { people: NewPerson[]; errors: RowError[] } {
  const header = (rows[0] ?? []).map(norm);
  const col = (k: keyof typeof COLUMNS) => header.findIndex((h) => COLUMNS[k].includes(h));
  const at = { name: col("name"), phone: col("phone"), branch: col("branch"), salary: col("salary") };
  const byName = new Map(branches.map((b) => [norm(b.name), b.id]));
  const only = branches.length === 1 ? branches[0].id : null;
  const people: NewPerson[] = [];
  const errors: RowError[] = [];
  const seen = new Set<string>();
  rows.slice(1).forEach((cells, i) => {
    const row = i + 2; // as numbered in the spreadsheet
    const get = (k: keyof typeof at) => (at[k] >= 0 ? String(cells[at[k]] ?? "").trim() : "");
    if (cells.every((c) => norm(c) === "")) return;
    const name = get("name");
    if (!name) return void errors.push({ row, key: "importNoName" });
    const phone = canonicalPhone(get("phone"));
    if (!phone) return void errors.push({ row, key: "importBadPhone", value: get("phone") });
    if (seen.has(phone)) return void errors.push({ row, key: "importDuplicatePhone", value: get("phone") });
    const branchName = get("branch");
    const branchId = branchName ? byName.get(norm(branchName)) : only;
    if (!branchId) return void errors.push({ row, key: "importNoBranch", value: branchName });
    const rawSalary = get("salary").replace(/,/g, "");
    const salary = rawSalary === "" ? null : Number(rawSalary);
    if (salary !== null && !(Number.isFinite(salary) && salary >= 0)) {
      return void errors.push({ row, key: "importBadSalary", value: get("salary") });
    }
    seen.add(phone);
    people.push({ row, name, phone, branchId, salaryPiastres: salary === null ? null : egpToPiastres(salary) });
  });
  return { people, errors };
}

/** A `.csv` file's text → rows (quoted fields and commas inside quotes kept). */
export function readCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); out.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); out.push(row); }
  return out;
}

/** Rows from an uploaded `.xlsx` (first sheet) or `.csv`. */
export async function readSheet(file: File): Promise<unknown[][]> {
  if (file.name.toLowerCase().endsWith(".csv")) return readCsv(await file.text());
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const ws = wb.worksheets[0];
  const rows: unknown[][] = [];
  ws?.eachRow({ includeEmpty: false }, (r) => {
    const values = (r.values as unknown[]).slice(1); // exceljs rows are 1-based
    rows.push(values.map((v) => (v && typeof v === "object" && "text" in (v as object) ? (v as { text: string }).text : v)));
  });
  return rows;
}
