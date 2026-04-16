import Link from "next/link";

export default function RecordNotFound() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center sm:px-6">
      <p className="text-[13px] text-neutral-500">No record with that number.</p>
      <Link href="/" className="mt-6 inline-block text-[13px] text-neutral-800 hover:underline">
        Home
      </Link>
    </main>
  );
}
