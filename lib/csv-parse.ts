import fs from "fs";
import { Estate } from "./types";

export const HEADERS: (keyof Estate)[] = [
  "estate_number",
  "county",
  "type",
  "status",
  "date_opened",
  "date_closed",
  "reference",
  "decedent_name",
  "personal_representative",
  "pr_address",
  "attorney",
  "scraped_at",
];

function parseLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function isValidRow(row: Partial<Estate>): row is Estate {
  return /^\d+$/.test(row.estate_number ?? "");
}

/** Legacy rows had `detail_url` before `scraped_at` (13 cols). New format has 12. */
function normalizeDataColumns(cols: string[]): string[] {
  if (cols.length === 13) {
    return [...cols.slice(0, 11), cols[12] ?? ""];
  }
  return cols;
}

export function parseEstatesFromCsv(csvPath: string): Estate[] {
  if (!fs.existsSync(csvPath)) return [];

  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
  const dataLines = lines.slice(1); // skip CSV header

  const estates: Estate[] = [];
  for (const line of dataLines) {
    const cols = normalizeDataColumns(parseLine(line));
    if (cols.length < HEADERS.length) continue;

    const row: Partial<Estate> = {};
    for (let i = 0; i < HEADERS.length; i++) {
      row[HEADERS[i]] = cols[i]?.trim() ?? "";
    }

    if (isValidRow(row)) {
      estates.push(row);
    }
  }

  return estates;
}
