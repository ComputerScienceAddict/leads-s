import fs from "fs";
import path from "path";
import { Estate } from "./types";

const CSV_PATH =
  process.env.ESTATES_CSV_PATH ??
  path.resolve(process.cwd(), "..", "maryland_estates.csv");

const HEADERS: (keyof Estate)[] = [
  "estate_number",
  "county",
  "type",
  "status",
  "date_opened",
  "date_closed",
  "decedent_name",
  "date_of_death",
  "date_of_filing",
  "will",
  "date_of_will",
  "date_of_probate",
  "personal_reps",
  "scraped_at",
];

function parseLine(line: string): string[] {
  // Handles quoted fields with embedded commas
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
  // estate_number must be numeric — filters out the header echo row
  return /^\d+$/.test(row.estate_number ?? "");
}

/** Legacy rows had `detail_url` before `scraped_at` (13 cols → 12 data cols). */
function normalizeDataColumns(cols: string[]): string[] {
  if (cols.length === 13) {
    return [...cols.slice(0, 11), cols[12] ?? ""];
  }
  return cols;
}

export function readEstates(): Estate[] {
  if (!fs.existsSync(CSV_PATH)) return [];

  const raw = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");

  // Skip the actual CSV header line
  const dataLines = lines.slice(1);

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

export function getCsvPath(): string {
  return CSV_PATH;
}

export function getEstateByNumber(estateNumber: string): Estate | undefined {
  return readEstates().find((e) => e.estate_number === estateNumber);
}
