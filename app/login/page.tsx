"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { sanitizeAuthErrorMessage } from "@/lib/auth-errors";

type Mode = "signin" | "signup";

function LoginForm() {
  const searchParams = useSearchParams();
  const urlErrorRaw = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlErrorRaw ? sanitizeAuthErrorMessage(urlErrorRaw) : null
  );
  const [info, setInfo] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    let json: { error?: string } = {};
    try {
      json = await res.json();
    } catch {
      // no-op
    }
    setLoading(false);
    if (!res.ok) {
      setError(sanitizeAuthErrorMessage(json.error ?? "Sign in failed."));
      return;
    }

    // Ensure profile row exists even if DB trigger was missing in earlier schema state.
    try {
      await fetch("/api/profile/ensure", { method: "POST" });
    } catch {
      // Non-fatal: middleware/session will still proceed.
    }

    window.location.assign("/");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setLoading(false);
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    let json: { error?: string; hasSession?: boolean } = {};
    try {
      json = await res.json();
    } catch {
      // no-op
    }

    setLoading(false);
    if (!res.ok) {
      setError(sanitizeAuthErrorMessage(json.error ?? "Sign up failed."));
      return;
    }

    if (json.hasSession) {
      try {
        await fetch("/api/profile/ensure", { method: "POST" });
      } catch {
        // Non-fatal: profile sync can happen on next authenticated request.
      }
      window.location.assign("/");
      return;
    }

    // No session: project likely requires email confirmation.
    setInfo(
      "Account created. Check your email to confirm the account, then sign in. " +
        "If you want instant login, disable 'Confirm email' in Supabase Auth settings."
    );
    setPassword("");
    setConfirm("");
    setMode("signin");
  }

  return (
    <main className="mx-auto w-full max-w-sm flex-1 px-5 py-24 sm:py-32">
      <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h1 className="text-xl font-semibold text-neutral-900">Account</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Email and password — no email verification step.
        </p>

        <div className="mt-6 flex rounded-lg border border-neutral-200 p-0.5 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-md py-2 font-medium transition ${
              mode === "signin"
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-md py-2 font-medium transition ${
              mode === "signup"
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Create account
          </button>
        </div>

        {info && (
          <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {info}
          </p>
        )}
        {error && (
          <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="mt-6 flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="mt-6 flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create account"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-sm flex-1 px-5 py-24 sm:py-32">
          <div className="rounded-2xl border border-neutral-200 bg-white px-8 py-10 text-sm text-neutral-500">
            Loading…
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
