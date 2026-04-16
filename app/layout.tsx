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

export const metadata: Metadata = {
  title: "Estate filings",
  description: "Washington County estate data.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en" className={`${dmSans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans text-[15px] leading-relaxed text-neutral-900 antialiased">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-[15px] font-semibold text-neutral-900 no-underline hover:text-neutral-700"
            >
              Estate filings
            </Link>
            <div className="flex items-center gap-4">
              {user && (
                <span className="hidden text-sm text-neutral-500 sm:block">
                  {user.email}
                </span>
              )}
              {user ? (
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-sm text-neutral-500 hover:text-neutral-800"
                  >
                    Sign out
                  </button>
                </form>
              ) : (
                <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-800">
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
