import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EstatesResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    200,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "25", 10))
  );

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "records_count, last_scrape_finished_at, last_ingested_at, last_result_page"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = profile?.records_count ?? 0;
  const lastFin =
    profile?.last_scrape_finished_at ?? profile?.last_ingested_at ?? null;
  const lastScrapedAt =
    typeof lastFin === "string"
      ? lastFin
      : lastFin instanceof Date
        ? lastFin.toISOString()
        : null;

  const body: EstatesResponse = {
    items: [],
    total,
    page,
    pageSize,
    lastScrapedAt,
    lastResultPage: profile?.last_result_page ?? null,
    leadsNote:
      "Detailed leads are not stored in the cloud. After each run you get a CSV by email; the file also lives on your scraper PC.",
  };
  return NextResponse.json(body);
}
