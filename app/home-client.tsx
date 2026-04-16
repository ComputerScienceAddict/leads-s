"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EstatesResponse, ScrapeState } from "@/lib/types";

export function HomeClient() {
  const [data, setData] = useState<EstatesResponse | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  const [scrapeState, setScrapeState] = useState<ScrapeState | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevScrapeStatusRef = useRef<string | null>(null);

  const fetchSnapshot = useCallback(async () => {
    setLoadingCount(true);
    try {
      const res = await fetch(`/api/estates?page=1&pageSize=10&q=&status=`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoadingCount(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const fetchScrapeStatus = useCallback(async () => {
    let res: Response;
    try {
      res = await fetch("/api/scrape");
    } catch {
      setScrapeMsg("Cannot reach app API. Check your network and try Refresh.");
      return;
    }
    let state: ScrapeState;
    try {
      state = await res.json();
    } catch {
      setScrapeMsg("Could not read scrape status response.");
      return;
    }

    const prev = prevScrapeStatusRef.current;
    prevScrapeStatusRef.current = state.status;
    setScrapeState(state);

    if (state.status === "error" && state.error) {
      setScrapeMsg(state.error);
    }

    if (state.status !== "running") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (
        prev === "running" &&
        state.status === "idle" &&
        state.finishedAt
      ) {
        setScrapeMsg("Done. Check your email for the CSV.");
        fetchSnapshot();
      }
    }
  }, [fetchSnapshot]);

  useEffect(() => {
    fetchScrapeStatus();
  }, [fetchScrapeStatus]);

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(fetchScrapeStatus, 5000);
  }

  async function handleRunCollection(maxRecords?: number) {
    setScrapeMsg(null);
    let res: Response;
    try {
      res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:
          maxRecords != null
            ? JSON.stringify({ max_records: maxRecords })
            : JSON.stringify({}),
      });
    } catch {
      setScrapeMsg("Could not start scrape: network error.");
      return;
    }
    let json: { error?: string; state?: ScrapeState } = {};
    try {
      json = await res.json();
    } catch {
      setScrapeMsg("Could not read server response.");
      return;
    }

    if (res.status === 409) {
      setScrapeMsg(json.error ?? "Already running.");
      return;
    }

    if (!res.ok) {
      setScrapeMsg(json.error ?? `Could not start (${res.status}).`);
      return;
    }

    if (json.state) setScrapeState(json.state);
    setScrapeMsg(
      maxRecords != null
        ? `Started — collecting up to ${maxRecords} new leads (skipping any estate # already in your CSV). Email when done.`
        : "Started on your scraper PC. You’ll get email when it finishes."
    );
    startPolling();
  }

  const isRunning = scrapeState?.status === "running";
  const count = data?.total ?? null;
  const workerNeedsSetup =
    scrapeMsg &&
    (scrapeMsg.includes("Cannot reach") ||
      scrapeMsg.includes("not configured") ||
      scrapeMsg.includes("SCRAPER_API"));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-[2rem]">
          Collect data
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600">
          Runs on <strong>your PC</strong> (Playwright + FastAPI). Cloudflare Tunnel lets this site
          send a start signal. Lead rows stay in a CSV on that machine—{' '}
          <strong>not</strong> in Supabase—and the same CSV is emailed to you when the run
          completes. Your Supabase profile only stores bookmark stats (counts, last run time).
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:px-8 sm:py-10">
        <div className="border-b border-neutral-100 pb-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Actions
          </h2>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleRunCollection(50)}
            disabled={isRunning}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 text-sm font-semibold transition ${
              isRunning
                ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
                : "bg-neutral-900 text-white hover:bg-neutral-800"
            }`}
          >
            {isRunning ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700"
                  aria-hidden
                />
                Running…
              </span>
            ) : (
              "Run quick (50)"
            )}
          </button>
          <button
            type="button"
            onClick={() => handleRunCollection()}
            disabled={isRunning}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-sm font-semibold transition ${
              isRunning
                ? "cursor-not-allowed text-neutral-400"
                : "text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            Run full
          </button>
          <button
            type="button"
            onClick={() => {
              fetchSnapshot();
              fetchScrapeStatus();
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700">
          <span className="font-medium">Status:</span>
          <span>
            {scrapeState?.status === "running"
              ? "Running"
              : scrapeState?.status === "error"
              ? "Error"
              : "Idle"}
          </span>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-5">
            <p className="text-xs font-medium text-neutral-500">Rows in last export</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-neutral-900">
              {loadingCount ? "—" : count !== null ? count.toLocaleString() : "0"}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Bookmark from last successful run (not live cloud data).
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/80 p-5">
            <p className="text-xs font-medium text-neutral-500">Last finished run</p>
            <p className="mt-2 font-mono text-lg font-medium tabular-nums leading-snug text-neutral-800">
              {data?.lastScrapedAt
                ? data.lastScrapedAt.replace("T", " ").slice(0, 19)
                : "—"}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Open the CSV from email or your scraper folder for full leads.
            </p>
          </div>
        </div>

        {data?.leadsNote && (
          <p className="mt-6 rounded-lg border border-neutral-100 bg-neutral-50/90 px-4 py-3 text-sm text-neutral-700">
            {data.leadsNote}
          </p>
        )}

        {scrapeMsg && (
          <div className="mt-8" role="status">
            {workerNeedsSetup ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                <p className="font-medium">Scraper worker offline</p>
                <p className="mt-1 text-amber-900/90">{scrapeMsg}</p>
                <p className="mt-3 text-amber-900/90">
                  From the repo root (next to <span className="font-mono">scraper.py</span>):
                </p>
                <pre className="mt-2 overflow-x-auto rounded-md bg-white/80 px-3 py-2 text-xs text-neutral-800">
                  pip install -r api/requirements.txt{"\n"}
                  python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
                </pre>
                <p className="mt-2 text-xs text-amber-900/85">
                  Match <span className="font-mono">SCRAPER_API_URL</span> and{" "}
                  <span className="font-mono">SCRAPER_API_SECRET</span> in{" "}
                  <span className="font-mono">web/.env.local</span> (the worker reads that file).
                  On Vercel, set <span className="font-mono">SCRAPER_API_URL</span> to your tunnel URL.
                </p>
              </div>
            ) : (
              <p className="rounded-lg bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                {scrapeMsg}
              </p>
            )}
          </div>
        )}

        <div className="mt-10 border-t border-neutral-100 pt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            Leads
          </h2>
          <p className="mt-3 text-sm text-neutral-600">
            Sample tables and per-estate pages are disabled while leads stay on the scraper PC.
            Use the emailed <span className="font-mono text-neutral-800">maryland_estates.csv</span>{" "}
            or the copy next to <span className="font-mono text-neutral-800">scraper.py</span>.
          </p>
        </div>
      </div>
    </main>
  );
}
