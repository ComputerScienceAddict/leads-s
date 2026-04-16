import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function envOrThrow(nameA: string, nameB?: string): string {
  const v = process.env[nameA] || (nameB ? process.env[nameB] : undefined);
  if (!v) {
    throw new Error(`Missing ${nameA}${nameB ? `/${nameB}` : ""}`);
  }
  return v;
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    hasSession: false,
  });
  try {
    const supabase = createServerClient(
      envOrThrow("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"),
      envOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      hasSession: Boolean(data.session),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Auth sign-up failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
