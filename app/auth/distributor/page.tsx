"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Hash,
  Lock,
} from "lucide-react";
import { useAppStore } from "@/hooks/use-app-store";

/* ── mock credentials (would be server-validated in production) ── */
const VALID_CREDENTIALS: Record<string, string> = {
  DIST001: "dist@123",
  DIST002: "dist@456",
};

const inputClass =
  "w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50";

const labelClass = "mb-1.5 block text-xs font-medium text-slate-400";

export default function DistributorLoginPage() {
  const router = useRouter();
  const { setRole } = useAppStore();

  const [distId, setDistId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!distId.trim()) {
      setError("Distributor ID is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100)); // mock latency

    const expected = VALID_CREDENTIALS[distId.trim().toUpperCase()];
    if (!expected || expected !== password) {
      setLoading(false);
      setError("Invalid Distributor ID or password. Please check your credentials.");
      return;
    }

    setRole("distributor");
    router.push("/distributor");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* bg glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-blue-700/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* back */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-300"
        >
          <ArrowLeft size={15} /> Back to role selection
        </button>

        {/* card */}
        <div className="rounded-2xl border border-slate-700/40 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">

          {/* header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10">
              <Truck size={22} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">
                Distributor Portal
              </h1>
              <p className="text-xs text-slate-500">GasSafe — Staff Access</p>
            </div>
          </div>

          {/* info note */}
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3">
            <p className="text-xs leading-relaxed text-blue-300">
              🔒 Access is restricted to authorised GasSafe distributors.
              Credentials are shared personally by the network administrator.
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {/* Distributor ID */}
            <div>
              <label htmlFor="dist-id" className={labelClass}>
                Distributor ID
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Hash size={15} />
                </span>
                <input
                  id="dist-id"
                  type="text"
                  placeholder="DIST001"
                  value={distId}
                  onChange={(e) => { setDistId(e.target.value); setError(""); }}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="dist-password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Lock size={15} />
                </span>
                <input
                  id="dist-password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-300"
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="dist-login-btn"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3 text-sm font-semibold text-slate-950 shadow transition hover:bg-blue-400 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* hint */}
        <p className="mt-6 text-center text-xs text-slate-700">
          Don&apos;t have credentials? Contact your GasSafe network admin.
        </p>
      </div>
    </div>
  );
}
