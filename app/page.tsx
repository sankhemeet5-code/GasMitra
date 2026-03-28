"use client";

import { useRouter } from "next/navigation";
import { Flame, Truck, ShieldCheck } from "lucide-react";

const ROLE_CARDS = [
  {
    role: "customer",
    href: "/auth/customer",
    title: "Customer",
    description:
      "Book LPG cylinders, track your delivery queue position, and view nearby distributors on a live map.",
    icon: Flame,
    gradient: "from-teal-500/20 via-slate-900 to-slate-900",
    border: "border-teal-500/20 hover:border-teal-400/50",
    iconBg: "bg-teal-400/10 text-teal-400",
    btn: "bg-teal-500 hover:bg-teal-400 text-slate-950",
    glow: "group-hover:shadow-teal-500/20",
    badge: "Sign Up / Login",
    badgeColor: "bg-teal-400/10 text-teal-300 border-teal-400/20",
  },
  {
    role: "distributor",
    href: "/auth/distributor",
    title: "Distributor",
    description:
      "Manage your priority delivery queue, update cylinder stock levels, and monitor demand heatmaps by PIN.",
    icon: Truck,
    gradient: "from-blue-500/20 via-slate-900 to-slate-900",
    border: "border-blue-500/20 hover:border-blue-400/50",
    iconBg: "bg-blue-400/10 text-blue-400",
    btn: "bg-blue-500 hover:bg-blue-400 text-slate-950",
    glow: "group-hover:shadow-blue-500/20",
    badge: "Credential Login",
    badgeColor: "bg-blue-400/10 text-blue-300 border-blue-400/20",
  },
  {
    role: "admin",
    href: "/auth/admin",
    title: "Admin",
    description:
      "Control crisis levels network-wide, review suspicious account alerts, and explore AI-powered insights.",
    icon: ShieldCheck,
    gradient: "from-purple-500/20 via-slate-900 to-slate-900",
    border: "border-purple-500/20 hover:border-purple-400/50",
    iconBg: "bg-purple-400/10 text-purple-400",
    btn: "bg-purple-500 hover:bg-purple-400 text-slate-950",
    glow: "group-hover:shadow-purple-500/20",
    badge: "Credential Login",
    badgeColor: "bg-purple-400/10 text-purple-300 border-purple-400/20",
  },
];

export default function RoleSelectorPage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-teal-500/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute bottom-1/4 left-0 h-48 w-48 rounded-full bg-blue-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl">
        {/* Header */}
        <header className="mb-12 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900 px-4 py-1.5 text-xs text-slate-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-teal-400" />
            Maharashtra Gas Distribution Network
          </span>

          <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-slate-100 sm:text-6xl">
            ⛽{" "}
            <span className="bg-gradient-to-r from-teal-400 to-teal-200 bg-clip-text text-transparent">
              GasSafe
            </span>
          </h1>

          <p className="mt-3 text-lg text-slate-400">
            Smart &amp; Fair LPG Distribution Platform
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Select your role to continue
          </p>
        </header>

        {/* Role selection cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          {ROLE_CARDS.map(
            ({
              role,
              href,
              title,
              description,
              icon: Icon,
              gradient,
              border,
              iconBg,
              btn,
              glow,
              badge,
              badgeColor,
            }) => (
              <div
                key={role}
                id={`role-card-${role}`}
                onClick={() => router.push(href)}
                className={`group relative cursor-pointer rounded-2xl border bg-gradient-to-b p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${gradient} ${border} ${glow}`}
              >
                {/* Access-type badge */}
                <span
                  className={`mb-4 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeColor}`}
                >
                  {badge}
                </span>

                {/* Icon */}
                <div
                  className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
                >
                  <Icon size={22} />
                </div>

                <h2 className="mb-2 text-xl font-bold text-slate-100">
                  {title}
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-slate-400">
                  {description}
                </p>

                <button
                  id={`role-btn-${role}`}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900 ${btn}`}
                >
                  Continue as {title}
                </button>
              </div>
            )
          )}
        </div>

        <p className="mt-10 text-center text-xs text-slate-700">
          GasSafe — Crisis-Ready Fair Allocation System
        </p>
      </div>
    </div>
  );
}
