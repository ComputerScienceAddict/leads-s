import type { Metadata } from "next";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const DEFAULT_BRAND = "Your company";

function appBrandName(): string {
  return process.env.NEXT_PUBLIC_APP_NAME?.trim() || DEFAULT_BRAND;
}

export async function generateMetadata(): Promise<Metadata> {
  const title = appBrandName();
  return {
    title,
    description: `${title} — Maryland county estate search and CSV export.`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const brand = appBrandName();

  return (
    <html lang="en" className={`${dmSans.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white font-sans text-[15px] leading-relaxed text-[#1d1d1f] antialiased">
        <header className="bg-[#fbfbfd]/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-sm items-center justify-between px-6 py-3">
            <Link
              href="/"
              className="text-[13px] font-semibold text-[#1d1d1f] no-underline transition-opacity hover:opacity-70"
            >
              {brand}
            </Link>
            <div className="flex shrink-0 items-center gap-4 text-[12px]">
              {user && (
                <span className="hidden max-w-[10rem] truncate text-[#86868b] sm:block">
                  {user.email}
                </span>
              )}
              {user ? (
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-[#0071e3] transition-opacity hover:opacity-70"
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="text-[#0071e3] transition-opacity hover:opacity-70"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
