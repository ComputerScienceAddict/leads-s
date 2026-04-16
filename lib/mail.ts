import nodemailer from "nodemailer";
import { HEADERS, parseEstatesFromCsv } from "./csv-parse";

const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_TO = process.env.SCRAPE_NOTIFY_EMAIL ?? "jjuar090@ucr.edu";

function escapeCsvField(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Attachment matches current schema (no `detail_url`), including legacy files on disk. */
function csvAttachmentBuffer(csvPath: string): Buffer {
  const rows = parseEstatesFromCsv(csvPath);
  const lines = [HEADERS.join(",")];
  for (const e of rows) {
    lines.push(HEADERS.map((h) => escapeCsvField(e[h] ?? "")).join(","));
  }
  return Buffer.from(lines.join("\n"), "utf-8");
}

export async function sendCsvAttachment(csvPath: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const csvBuffer = csvAttachmentBuffer(csvPath);

  await transporter.sendMail({
    from: `"Maryland Estates Scraper" <${SMTP_USER}>`,
    to: SMTP_TO,
    subject: `Maryland Estates CSV — ${new Date().toLocaleDateString()}`,
    text: [
      "The Maryland Register of Wills scrape has completed successfully.",
      "",
      `County: Washington`,
      `Date range: 04/14/2024 – 04/14/2026`,
      `File: maryland_estates.csv (attached)`,
      "",
      "This email was generated automatically.",
    ].join("\n"),
    attachments: [
      {
        filename: "maryland_estates.csv",
        content: csvBuffer,
        contentType: "text/csv",
      },
    ],
  });

  console.log(`[mail] CSV sent to ${SMTP_TO}`);
}
