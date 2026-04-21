"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EstatesResponse, ScrapeState } from "@/lib/types";
import { MD_COUNTIES } from "@/lib/mdCounties";

/** max_records sent to worker; "full" = no cap (entire county for the date range). */
const LEAD_AMOUNT_OPTIONS: { value: string; label: string }[] = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
  { value: "250", label: "250" },
  { value: "500", label: "500" },
  { value: "full", label: "No limit" },
];

function parseStartedAt(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

export function HomeClient() {
  const [data, setData] = useState<EstatesResponse | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  const [scrapeState, setScrapeState] = useState<ScrapeState | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [scrapeCounty, setScrapeCounty] = useState("Washington");
  const [leadAmount, setLeadAmount] = useState("10");
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
        setScrapeMsg("Finished. CSV emailed.");
        fetchSnapshot();
      }
    }
  }, [fetchSnapshot]);

  useEffect(() => {
    fetchScrapeStatus();
  }, [fetchScrapeStatus]);

  /** While a scrape is running, refresh elapsed time every second. */
  useEffect(() => {
    if (scrapeState?.status !== "running") return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [scrapeState?.status]);

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(fetchScrapeStatus, 5000);
  }

  async function handleRunCollection() {
    setScrapeMsg(null);
    let maxRecords: number | undefined;
    if (leadAmount === "full") {
      maxRecords = undefined;
    } else {
      const parsed = Number.parseInt(leadAmount, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        setScrapeMsg("Choose a valid lead amount.");
        return;
      }
      maxRecords = parsed;
    }

    let res: Response;
    try {
      res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          county: scrapeCounty,
          ...(maxRecords != null ? { max_records: maxRecords } : {}),
        }),
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
        ? `Running: up to ${maxRecords} leads · ${scrapeCounty}`
        : `Running: no cap · ${scrapeCounty}`
    );
    startPolling();
  }

  const isRunning = scrapeState?.status === "running";
  const startedMs = parseStartedAt(scrapeState?.startedAt ?? null);
  const elapsedSec =
    isRunning && startedMs != null
      ? Math.max(0, Math.floor((nowTick - startedMs) / 1000))
      : null;
  const count = data?.total ?? null;
  const workerNeedsSetup =
    scrapeMsg &&
    (scrapeMsg.includes("Cannot reach") ||
      scrapeMsg.includes("not configured") ||
      scrapeMsg.includes("SCRAPER_API"));

  const selectCls =
    "h-11 w-full rounded-xl border-0 bg-[#f5f5f7] px-4 text-[15px] text-[#1d1d1f] outline-none transition-all duration-200 focus:bg-white focus:ring-2 focus:ring-[#0071e3]/30 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="space-y-6">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-xs font-medium tracking-wide text-[#86868b]">County</span>
              <select
                value={scrapeCounty}
                onChange={(e) => setScrapeCounty(e.target.value)}
                disabled={isRunning}
                className={selectCls}
              >
                {MD_COUNTIES.map((c) => (
                  <option key={c.value} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-xs font-medium tracking-wide text-[#86868b]">Records</span>
              <select
                value={leadAmount}
                onChange={(e) => setLeadAmount(e.target.value)}
                disabled={isRunning}
                className={selectCls}
              >
                {LEAD_AMOUNT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => handleRunCollection()}
            disabled={isRunning}
            className={`group relative isolate h-[3.25rem] w-full overflow-hidden rounded-full text-[15px] font-semibold tracking-tight transition-[transform,box-shadow,filter] duration-300 ease-out ${
              isRunning
                ? "cursor-not-allowed bg-[#f5f5f7] text-[#86868b] shadow-none"
                : "bg-gradient-to-b from-[#42a1ff] to-[#0071e3] text-white shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_4px_14px_rgba(0,113,227,0.35)] hover:shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_8px_22px_rgba(0,113,227,0.42)] hover:brightness-[1.03] active:scale-[0.985] active:brightness-[0.98]"
            }`}
          >
            {!isRunning && (
              <span
                className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/22 to-transparent opacity-90"
                aria-hidden
              />
            )}
            <span className="relative flex items-center justify-center gap-2.5">
              {isRunning ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-[#86868b]/25 border-t-[#6e6e73]"
                    aria-hidden
                  />
                  Working
                </>
              ) : (
                <>
                  Download CSV
                  <span
                    className="text-[13px] font-normal text-white/90 transition group-hover:text-white"
                    aria-hidden
                  >
                    →
                  </span>
                </>
              )}
            </span>
          </button>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                fetchSnapshot();
                fetchScrapeStatus();
              }}
              className="text-[13px] font-medium text-[#0071e3] transition-opacity hover:opacity-70"
            >
              Refresh
            </button>
            <span className="text-[13px] tabular-nums text-[#86868b]">
              {scrapeState?.status === "running"
                ? "Working"
                : scrapeState?.status === "error"
                  ? "Error"
                  : "Ready"}
              {isRunning && elapsedSec != null && (
                <span>
                  {" "}
                  · {Math.floor(elapsedSec / 60)}:{String(elapsedSec % 60).padStart(2, "0")}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="mt-10 flex justify-center gap-8 text-[12px] text-[#86868b]">
          <div className="text-center">
            <div className="text-[20px] font-semibold tabular-nums text-[#1d1d1f]">
              {loadingCount ? "—" : count !== null ? count.toLocaleString() : "0"}
            </div>
            <div className="mt-0.5">rows</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-semibold tabular-nums text-[#1d1d1f]">
              {data?.lastResultPage ?? 1}
            </div>
            <div className="mt-0.5">page</div>
          </div>
        </div>

        {scrapeMsg && (
          <div className="mt-8" role="status">
            {workerNeedsSetup ? (
              <div className="rounded-xl bg-[#fff3cd] p-4 text-[13px] text-[#856404]">
                <p className="font-medium">Worker offline</p>
                <p className="mt-1 text-[12px] opacity-80">{scrapeMsg}</p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-white/60 px-3 py-2 font-mono text-[11px] text-[#1d1d1f]">
                  pip install -r api/requirements.txt{"\n"}
                  uvicorn api.main:app --port 8000
                </pre>
              </div>
            ) : (
              <p className="text-center text-[13px] text-[#86868b]">{scrapeMsg}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
