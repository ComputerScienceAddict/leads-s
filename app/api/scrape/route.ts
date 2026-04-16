import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function scraperBaseUrl(): string | null {
  // Primary: server env on Vercel. Fallback: NEXT_PUBLIC_* to tolerate legacy setups.
  const u =
    process.env.SCRAPER_API_URL?.trim() ??
    process.env.NEXT_PUBLIC_SCRAPER_API_URL?.trim();
  if (!u) return null;
  return u.replace(/\/$/, "");
}

async function proxyScraper(
  path: string,
  init: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const base = scraperBaseUrl();
  const secret = process.env.SCRAPER_API_SECRET?.trim();
  if (!base || !secret) {
    const missing = [
      !base ? "SCRAPER_API_URL" : null,
      !secret ? "SCRAPER_API_SECRET" : null,
    ]
      .filter(Boolean)
      .join(" + ");
    return NextResponse.json(
      {
        status: "error" as const,
        startedAt: null,
        finishedAt: null,
        error: `Scraper worker not configured (missing ${missing}).`,
        startedByUserId: null,
      },
      { status: 503 }
    );
  }

  const { timeoutMs, ...rest } = init;
  const ctl =
    timeoutMs != null ? AbortSignal.timeout(timeoutMs) : init.signal;

  try {
    return await fetch(`${base}${path}`, {
      ...rest,
      signal: ctl,
      headers: {
        Authorization: `Bearer ${secret}`,
        ...((rest.headers as Record<string, string>) ?? {}),
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error" as const,
        startedAt: null,
        finishedAt: null,
        error: "Cannot reach the scraper worker (FastAPI not running or wrong URL).",
        startedByUserId: null,
      },
      { status: 502 }
    );
  }
}

export async function GET() {
  const res = await proxyScraper("/internal/scrape/status", {
    method: "GET",
    timeoutMs: 10_000,
  });
  if (res.status === 503 || res.status === 502) {
    return res as NextResponse;
  }
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      { error: "Unauthorized or missing email for CSV delivery." },
      { status: 401 }
    );
  }

  let maxRecords: number | undefined;
  try {
    const body = (await req.json()) as { max_records?: unknown };
    if (body?.max_records != null) {
      const n = Number(body.max_records);
      if (!Number.isFinite(n) || n < 1 || n > 10_000) {
        return NextResponse.json(
          { error: "max_records must be between 1 and 10000." },
          { status: 400 }
        );
      }
      maxRecords = Math.floor(n);
    }
  } catch {
    // empty body is fine — full run
  }

  const res = await proxyScraper("/internal/scrape/start", {
    method: "POST",
    timeoutMs: 20_000,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.id,
      user_email: user.email,
      ...(maxRecords != null ? { max_records: maxRecords } : {}),
    }),
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
