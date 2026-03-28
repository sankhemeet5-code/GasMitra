"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Phone,
  User,
  MapPin,
  Users,
  Hash,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { useAppStore } from "@/hooks/use-app-store";
import { CustomerProfile } from "@/types";

/* ─── helpers ─────────────────────────────────────────────────────────── */
type Tab = "signup" | "login";
type LoginStep = "phone" | "otp";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-rose-400">{msg}</p>;
}

function InputWrapper({ children }: { children: React.ReactNode }) {
  return <div className="relative">{children}</div>;
}

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
      {children}
    </span>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-700/60 bg-slate-800/60 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50";

const labelClass = "mb-1.5 block text-xs font-medium text-slate-400";

/* ───────────────────────────────────────────────────────────────────────── */

export default function CustomerAuthPage() {
  const router = useRouter();
  const { setRole, setCustomerProfile, setCurrentUserId } = useAppStore();
  const [tab, setTab] = useState<Tab>("login");

  /* ── sign-up state ─────────────────────────────── */
  const [form, setForm] = useState({
    name: "",
    phone: "",
    pincode: "",
    familySize: "",
    rationNumber: "",
    aadhaarLast4: "",
    businessLicense: "",
    hasBusinessLicense: false,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  /* ── login state ───────────────────────────────── */
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPhoneError, setLoginPhoneError] = useState("");
  const [loginStep, setLoginStep] = useState<LoginStep>("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── countdown timer ───────────────────────────── */
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  /* ── sign-up validation ────────────────────────── */
  function validateSignup(): boolean {
    const errs: typeof formErrors = {};

    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Enter your full name as per Aadhaar (min 2 chars)";

    if (!/^[6-9]\d{9}$/.test(form.phone))
      errs.phone = "Enter a valid 10-digit Indian mobile number";

    if (!/^\d{6}$/.test(form.pincode))
      errs.pincode = "Enter a valid 6-digit pincode";

    const fs = parseInt(form.familySize);
    if (!form.familySize || isNaN(fs) || fs < 1 || fs > 20)
      errs.familySize = "Family size must be between 1 and 20";

    if (!form.rationNumber.trim())
      errs.rationNumber = "Ration card number is required";

    if (!/^\d{4}$/.test(form.aadhaarLast4))
      errs.aadhaarLast4 = "Enter the last 4 digits of your Aadhaar";

    if (form.hasBusinessLicense && !form.businessLicense.trim())
      errs.businessLicense = "Enter your business license number";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!validateSignup()) return;

    setSignupLoading(true);
    const profile: CustomerProfile = {
      name: form.name.trim(),
      phone: form.phone,
      pincode: form.pincode,
      familySize: parseInt(form.familySize),
      rationNumber: form.rationNumber.trim(),
      aadhaarLast4: form.aadhaarLast4,
      businessLicense: form.hasBusinessLicense
        ? form.businessLicense.trim()
        : undefined,
    };

    try {
      const response = await fetch("/api/auth/customer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Signup failed");
      }

      const data = (await response.json()) as { userId: string };
      setCustomerProfile(profile);
      setCurrentUserId(data.userId);
      setRole("customer");
      setSignupDone(true);
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setFormErrors((prev) => ({ ...prev, phone: message }));
    } finally {
      setSignupLoading(false);
    }
  }

  /* ── login: send OTP ───────────────────────────── */
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(loginPhone)) {
      setLoginPhoneError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoginPhoneError("");
    setSendingOtp(true);

    try {
      const response = await fetch("/api/auth/customer/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setLoginPhoneError(data.error ?? "Unable to request OTP");
        return;
      }

      setOtpSent(true);
      setCountdown(30);
      setLoginStep("otp");
    } finally {
      setSendingOtp(false);
    }
  }

  /* ── OTP input handling ───────────────────────── */
  function handleOtpChange(idx: number, val: string) {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (digits.length === 6) {
      setOtp(digits.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  }

  /* ── login: verify OTP ─────────────────────────── */
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Enter the complete 6-digit OTP");
      return;
    }
    setOtpError("");
    setVerifyingOtp(true);

    try {
      const response = await fetch("/api/auth/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone, otp: code }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setOtpError(data.error ?? "OTP verification failed");
        return;
      }

      const data = (await response.json()) as { userId: string };

      setCurrentUserId(data.userId);
      setRole("customer");
      router.push("/dashboard");
    } finally {
      setVerifyingOtp(false);
    }
  }

  /* ── field updater ─────────────────────────────── */
  const f = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((p) => ({ ...p, [key]: e.target.value }));
      setFormErrors((p) => ({ ...p, [key]: undefined }));
    };

  /* ─── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* bg glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-60 w-60 rounded-full bg-teal-700/8 blur-3xl" />
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
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/10">
              <Flame size={22} className="text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Customer Portal</h1>
              <p className="text-xs text-slate-500">GasSafe LPG Distribution</p>
            </div>
          </div>

          {/* tabs */}
          <div className="mb-7 flex gap-1 rounded-xl bg-slate-800/60 p-1">
            {(["login", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => { setTab(t); setLoginStep("phone"); setOtp(["","","","","",""]); }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? "bg-teal-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* ═══ LOGIN PANEL ═══ */}
          {tab === "login" && (
            <div>
              {loginStep === "phone" && (
                <form onSubmit={handleSendOtp} noValidate>
                  <p className="mb-5 text-sm text-slate-400">
                    Enter your registered mobile number to receive a one-time
                    password.
                  </p>

                  <div className="mb-5">
                    <label htmlFor="login-phone" className={labelClass}>
                      Mobile Number
                    </label>
                    <InputWrapper>
                      <IconWrap><Phone size={15} /></IconWrap>
                      <input
                        id="login-phone"
                        type="tel"
                        maxLength={10}
                        placeholder="98XXXXXXXX"
                        value={loginPhone}
                        onChange={(e) => {
                          setLoginPhone(e.target.value.replace(/\D/g, ""));
                          setLoginPhoneError("");
                        }}
                        className={inputClass}
                      />
                    </InputWrapper>
                    <FieldError msg={loginPhoneError} />
                  </div>

                  <button
                    type="submit"
                    id="send-otp-btn"
                    disabled={sendingOtp}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-semibold text-slate-950 shadow transition hover:bg-teal-400 disabled:opacity-60"
                  >
                    {sendingOtp ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending OTP…</>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </form>
              )}

              {loginStep === "otp" && (
                <form onSubmit={handleVerifyOtp} noValidate>
                  <div className="mb-5 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
                    <p className="text-xs text-teal-300">
                      OTP sent to{" "}
                      <strong>+91 {loginPhone}</strong>.{" "}
                      <button
                        type="button"
                        onClick={() => setLoginStep("phone")}
                        className="underline underline-offset-2 hover:text-teal-200"
                      >
                        Change
                      </button>
                    </p>
                  </div>

                  <div className="mb-5">
                    <label className={labelClass}>Enter 6-digit OTP</label>
                    <div className="flex gap-2" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="h-12 w-full rounded-xl border border-slate-700/60 bg-slate-800/60 text-center text-lg font-bold text-teal-300 outline-none transition focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20"
                        />
                      ))}
                    </div>
                    <FieldError msg={otpError} />
                  </div>

                  {countdown > 0 ? (
                    <p className="mb-4 text-center text-xs text-slate-500">
                      Resend OTP in{" "}
                      <span className="font-semibold text-slate-300">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="mb-4 w-full text-center text-xs text-teal-400 transition hover:text-teal-300"
                    >
                      Resend OTP
                    </button>
                  )}

                  <button
                    type="submit"
                    id="verify-otp-btn"
                    disabled={verifyingOtp}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-semibold text-slate-950 shadow transition hover:bg-teal-400 disabled:opacity-60"
                  >
                    {verifyingOtp ? (
                      <><Loader2 size={16} className="animate-spin" /> Verifying…</>
                    ) : (
                      "Verify & Login"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ═══ SIGN UP PANEL ═══ */}
          {tab === "signup" && (
            <form onSubmit={handleSignup} noValidate>
              {signupDone ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle2 size={52} className="text-teal-400" />
                  <p className="text-lg font-bold text-slate-100">
                    Account Created!
                  </p>
                  <p className="text-sm text-slate-400">
                    Redirecting to your dashboard…
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {/* Name */}
                  <div>
                    <label htmlFor="su-name" className={labelClass}>
                      Full Name <span className="text-rose-400">*</span>
                      <span className="ml-1 text-slate-600">(as per Aadhaar)</span>
                    </label>
                    <InputWrapper>
                      <IconWrap><User size={15} /></IconWrap>
                      <input
                        id="su-name"
                        type="text"
                        placeholder="Anita Patil"
                        value={form.name}
                        onChange={f("name")}
                        className={inputClass}
                      />
                    </InputWrapper>
                    <FieldError msg={formErrors.name} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="su-phone" className={labelClass}>
                      Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <InputWrapper>
                      <IconWrap><Phone size={15} /></IconWrap>
                      <input
                        id="su-phone"
                        type="tel"
                        maxLength={10}
                        placeholder="98XXXXXXXX"
                        value={form.phone}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }));
                          setFormErrors((p) => ({ ...p, phone: undefined }));
                        }}
                        className={inputClass}
                      />
                    </InputWrapper>
                    <FieldError msg={formErrors.phone} />
                  </div>

                  {/* Pincode + Family size (2-col) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="su-pincode" className={labelClass}>
                        Pincode <span className="text-rose-400">*</span>
                      </label>
                      <InputWrapper>
                        <IconWrap><MapPin size={15} /></IconWrap>
                        <input
                          id="su-pincode"
                          type="text"
                          maxLength={6}
                          placeholder="411001"
                          value={form.pincode}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "") }));
                            setFormErrors((p) => ({ ...p, pincode: undefined }));
                          }}
                          className={inputClass}
                        />
                      </InputWrapper>
                      <FieldError msg={formErrors.pincode} />
                    </div>

                    <div>
                      <label htmlFor="su-family" className={labelClass}>
                        Family Size <span className="text-rose-400">*</span>
                      </label>
                      <InputWrapper>
                        <IconWrap><Users size={15} /></IconWrap>
                        <input
                          id="su-family"
                          type="number"
                          min={1}
                          max={20}
                          placeholder="4"
                          value={form.familySize}
                          onChange={f("familySize")}
                          className={inputClass}
                        />
                      </InputWrapper>
                      <FieldError msg={formErrors.familySize} />
                    </div>
                  </div>

                  {/* Ration number */}
                  <div>
                    <label htmlFor="su-ration" className={labelClass}>
                      Ration Card Number <span className="text-rose-400">*</span>
                    </label>
                    <InputWrapper>
                      <IconWrap><Hash size={15} /></IconWrap>
                      <input
                        id="su-ration"
                        type="text"
                        placeholder="MH-NA-123456789"
                        value={form.rationNumber}
                        onChange={f("rationNumber")}
                        className={inputClass}
                      />
                    </InputWrapper>
                    <FieldError msg={formErrors.rationNumber} />
                  </div>

                  {/* Aadhaar last 4 */}
                  <div>
                    <label htmlFor="su-aadhaar" className={labelClass}>
                      Aadhaar Last 4 Digits <span className="text-rose-400">*</span>
                    </label>
                    <InputWrapper>
                      <IconWrap><ShieldCheck size={15} /></IconWrap>
                      <input
                        id="su-aadhaar"
                        type="text"
                        maxLength={4}
                        placeholder="1234"
                        value={form.aadhaarLast4}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, aadhaarLast4: e.target.value.replace(/\D/g, "") }));
                          setFormErrors((p) => ({ ...p, aadhaarLast4: undefined }));
                        }}
                        className={inputClass}
                      />
                    </InputWrapper>
                    <FieldError msg={formErrors.aadhaarLast4} />
                  </div>

                  {/* Business license (optional) */}
                  <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        id="su-has-license"
                        type="checkbox"
                        checked={form.hasBusinessLicense}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            hasBusinessLicense: e.target.checked,
                            businessLicense: e.target.checked ? p.businessLicense : "",
                          }))
                        }
                        className="h-4 w-4 rounded accent-teal-500"
                      />
                      <span className="text-sm text-slate-300">
                        I have a{" "}
                        <span className="font-medium text-teal-300">
                          business / commercial license
                        </span>{" "}
                        (for commercial gas cylinder)
                      </span>
                    </label>

                    {form.hasBusinessLicense && (
                      <div className="mt-3">
                        <label htmlFor="su-license" className={labelClass}>
                          Business License Number{" "}
                          <span className="text-rose-400">*</span>
                        </label>
                        <InputWrapper>
                          <IconWrap><Briefcase size={15} /></IconWrap>
                          <input
                            id="su-license"
                            type="text"
                            placeholder="MH/GST/2024/XXXXX"
                            value={form.businessLicense}
                            onChange={f("businessLicense")}
                            className={inputClass}
                          />
                        </InputWrapper>
                        <FieldError msg={formErrors.businessLicense} />
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    id="signup-btn"
                    disabled={signupLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-semibold text-slate-950 shadow transition hover:bg-teal-400 disabled:opacity-60"
                  >
                    {signupLoading ? (
                      <><Loader2 size={16} className="animate-spin" /> Creating Account…</>
                    ) : (
                      "Create Account"
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-600">
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("login")}
                      className="text-teal-400 transition hover:text-teal-300"
                    >
                      Login here
                    </button>
                  </p>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
