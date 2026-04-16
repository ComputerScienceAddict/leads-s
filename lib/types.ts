export interface Estate {
  estate_number: string;
  county: string;
  type: string;
  status: string;
  date_opened: string;
  date_closed: string;
  reference: string;
  decedent_name: string;
  personal_representative: string;
  pr_address: string;
  attorney: string;
  scraped_at: string;
}

/** Bookmarks from Supabase profiles only — no lead rows in the database. */
export interface EstatesResponse {
  items: Estate[];
  total: number;
  page: number;
  pageSize: number;
  /** Last finished scrape time (profile bookmark). */
  lastScrapedAt: string | null;
  lastResultPage: number | null;
  /** Explains that detailed leads live on the scraper PC + email. */
  leadsNote?: string;
}

export type ScrapeStatus = "idle" | "running" | "error";

export interface ScrapeState {
  status: ScrapeStatus;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  startedByUserId?: string | null;
}
