import type { Metadata } from "next";
import Link from "next/link";

type PageProps = {
  params: Promise<{ estateNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { estateNumber } = await params;
  return { title: `Estate ${estateNumber}` };
}

export default async function EstateRecordPage({ params }: PageProps) {
  const { estateNumber } = await params;

  return (
    <main className="mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:px-8 sm:py-10">
        <p className="text-xs text-neutral-500">
          <Link href="/" className="font-medium text-neutral-800 hover:underline">
            Home
          </Link>
          <span className="text-neutral-300"> / </span>
          <span className="font-mono tabular-nums text-neutral-600">{estateNumber}</span>
        </p>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-neutral-900">
          Estate {estateNumber}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          Lead details are <strong>not</strong> stored in the cloud. Open your latest{" "}
          <span className="font-mono text-neutral-800">maryland_estates.csv</span> from email or
          your scraper PC and search for this estate number.
        </p>
        <p className="mt-6 text-sm text-neutral-500">
          <a
            href="https://registers.maryland.gov/RowNetWeb/Estates/frmEstateSearch2.aspx"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-neutral-800 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-600"
          >
            Maryland Register of Wills — estate search
          </a>
        </p>
      </div>
    </main>
  );
}
