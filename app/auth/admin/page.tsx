"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Hash,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { useAppStore } from "@/hooks/use-app-store";

/* ── mock credentials (would be server-validated in production) ── */
const VALID_CREDENTIALS: Record<string, string> = {
  ADMIN001: "admin@123",
  ADMIN002: "admin@456",
};

const inputClass =
  "w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50";

const labelClass = "mb-1.5 block text-xs font-medium text-slate-400";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setRole } = useAppStore();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const isLocked = attempts >= 5;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setError("");

    if (!adminId.trim()) {
      setError("Admin ID is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1100));

    const expected = VALID_CREDENTIALS[adminId.trim().toUpperCase()];
    if (!expected || expected !== password) {
      setLoading(false);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setError(
          "Too many failed attempts. This session is temporarily locked."
        );
      } else {
        setError(
          `Invalid Admin ID or password. ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? "s" : ""} remaining.`
        );
      }
      return;
    }

    setRole("admin");
    router.push("/admin");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* bg glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-purple-700/8 blur-3xl" />
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-400/10">
              <ShieldCheck size={22} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Admin Portal</h1>
              <p className="text-xs text-slate-500">GasSafe — Restricted Access</p>
            </div>
          </div>

          {/* security warning */}
          <div className="mb-6 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-purple-300">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              Highly restricted area. All access attempts are logged. Use of
              unauthorised credentials is a violation of the GasSafe Terms of
              Service.
            </p>
          </div>

          {isLocked ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-5 py-6 text-center">
              <AlertTriangle size={32} className="mx-auto mb-3 text-rose-400" />
              <p className="mb-1 font-semibold text-rose-300">
                Session Locked
              </p>
              <p className="text-xs text-slate-500">
                Too many failed attempts. Please contact your GasSafe
                network administrator to reset access.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              {/* Admin ID */}
              <div>
                <label htmlFor="admin-id" className={labelClass}>
                  Admin ID
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                    <Hash size={15} />
                  </span>
                  <input
                    id="admin-id"
                    type="text"
                    placeholder="ADMIN001"
                    value={adminId}
                    onChange={(e) => { setAdminId(e.target.value); setError(""); }}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="admin-password" className={labelClass}>
                  Password
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
                    <Lock size={15} />
                  </span>
                  <input
                    id="admin-password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className={`${inputClass} pr-10`}
                    autoComplete="current-password"
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

              {/* Attempt indicator */}
              {attempts > 0 && !isLocked && (
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < attempts ? "bg-rose-500" : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                id="admin-login-btn"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-500 py-3 text-sm font-semibold text-slate-50 shadow transition hover:bg-purple-400 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Authenticating…</>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          )}
        </div>

        {/* hint */}
        <p className="mt-6 text-center text-xs text-slate-700">
          Don&apos;t have credentials? Contact your GasSafe network admin.
        </p>
      </div>
    </div>
  );
}
