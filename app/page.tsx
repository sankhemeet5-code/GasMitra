"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Flame,
  Fuel,
  Truck,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  MapPin,
  MessageCircle,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Users,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
  Globe,
  Shield,
  Bot,
  Activity,
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

/* ──────────────────────────────────────────────────────────── */
/*  Gas Companies for Marquee                                  */
/* ──────────────────────────────────────────────────────────── */
const GAS_COMPANIES = [
  "Indian Oil Corporation",
  "Bharat Petroleum",
  "Hindustan Petroleum",
  "Indane Gas",
  "HP Gas",
  "Bharat Gas",
  "GAIL India",
  "Adani Total Gas",
  "Mahanagar Gas Ltd",
  "Gujarat Gas",
  "Petronet LNG",
  "Oil India Limited",
  "ONGC",
  "Reliance Gas",
  "Torrent Gas",
  "IRM Energy",
  "Sabarmati Gas",
  "Maharashtra Natural Gas",
  "Central UP Gas",
  "Assam Gas Company",
];

/* ──────────────────────────────────────────────────────────── */
/*  Stats                                                      */
/* ──────────────────────────────────────────────────────────── */
const STATS = [
  { value: "2.4M+",  label: "Cylinders Distributed",  icon: Flame },
  { value: "1,200+", label: "Active Distributors",     icon: Truck },
  { value: "36",     label: "Districts Covered",       icon: MapPin },
  { value: "99.7%",  label: "Fair Allocation Rate",    icon: ShieldCheck },
];

/* ──────────────────────────────────────────────────────────── */
/*  Features                                                   */
/* ──────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Shield,
    title: "Role-Based Access Control",
    description:
      "Secure, separate dashboards for customers, distributors and admins — each protected by server-side middleware.",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    border: "border-teal-500/20 hover:border-teal-400/40",
  },
  {
    icon: BarChart3,
    title: "Transparent Priority Scoring",
    description:
      "Fair queue allocation using a scored algorithm — factoring in days since last booking, BPL status, and urgency.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-500/20 hover:border-blue-400/40",
  },
  {
    icon: MapPin,
    title: "Live Distributor Map",
    description:
      "Interactive map with color-coded stock levels — green, yellow, and red pins show real-time cylinder availability.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-500/20 hover:border-emerald-400/40",
  },
  {
    icon: Bot,
    title: "AI-Powered Assistant",
    description:
      "In-app chatbot that helps customers with bookings, eligibility queries, emergency guidance, and complaint filing.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    border: "border-violet-500/20 hover:border-violet-400/40",
  },
  {
    icon: AlertTriangle,
    title: "Crisis Management",
    description:
      "Admin-controlled emergency mode that auto-prioritises medical and BPL households during shortage crises.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-500/20 hover:border-amber-400/40",
  },
  {
    icon: Activity,
    title: "Anomaly Detection",
    description:
      "Suspicious booking patterns are flagged automatically — duplicate phone numbers, same-address clustering, and rapid re-orders.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
    border: "border-rose-500/20 hover:border-rose-400/40",
  },
];

/* ──────────────────────────────────────────────────────────── */
/*  How It Works                                               */
/* ──────────────────────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Select Your Role",
    description:
      "Choose between Customer, Distributor, or Admin portal. Each role gets a secure login — OTP for customers, credentials for staff.",
    icon: Users,
  },
  {
    num: "02",
    title: "Book or Manage",
    description:
      "Customers book cylinders and see their priority score. Distributors manage queues and stock. Admins control crisis levels.",
    icon: Zap,
  },
  {
    num: "03",
    title: "Track & Assist",
    description:
      "Real-time delivery tracking, AI chatbot for instant help, and emergency alerts keep every stakeholder informed.",
    icon: Globe,
  },
];

/* ──────────────────────────────────────────────────────────── */
/*  FAQ                                                        */
/* ──────────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: "What is GasSafe?",
    a: "GasSafe is a smart LPG distribution platform that ensures fair, transparent cylinder allocation using priority scoring, role-based access, and an AI-powered chatbot.",
  },
  {
    q: "How does the priority queue work?",
    a: "Scores are calculated from three factors: days since your last booking (up to 40 pts), BPL status (+25 pts), and urgency type (medical +35, BPL +24, regular +12). Higher scores mean faster delivery.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. Only the last 4 digits of your Aadhaar are stored, phone numbers are masked, and all dashboard routes are protected by middleware and role guards.",
  },
  {
    q: "What happens during a crisis?",
    a: "The admin activates Emergency Mode, which re-prioritises medical and BPL households to the top of every distributor's queue. Cooldowns may also be relaxed.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Pending bookings can be cancelled by contacting your distributor. Note: cancellation does not reset the 30-day cooldown period.",
  },
];

/* ──────────────────────────────────────────────────────────── */
/*  Marquee Component                                          */
/* ──────────────────────────────────────────────────────────── */
function Marquee() {
  const doubled = [...GAS_COMPANIES, ...GAS_COMPANIES];
  return (
    <div className="relative w-full overflow-hidden py-6">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white dark:from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white dark:from-slate-950 to-transparent" />

      <div className="marquee-track flex w-max gap-8">
        {doubled.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/50 px-5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 backdrop-blur-sm transition-colors hover:border-teal-400/50 hover:text-teal-600 dark:hover:text-teal-400"
          >
            <Flame size={14} className="text-teal-500" />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Navbar                                                     */
/* ──────────────────────────────────────────────────────────── */
function Navbar() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { label: "Features",     href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ",          href: "#faq" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
      {/* Pill container */}
      <div className="flex h-12 w-full max-w-3xl items-center justify-between rounded-full border border-white/10 bg-slate-900/90 px-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 text-sm font-bold"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-white">
            <Fuel size={14} />
          </span>
          <span className="text-slate-100">
            Gas<span className="text-teal-400">Safe</span>
          </span>
        </button>

        {/* Center links */}
        <div className="hidden items-center gap-0.5 sm:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-100 hover:bg-white/10"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-slate-300 transition-all hover:text-white hover:bg-white/20 hover:border-white/30"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <button
            onClick={() => router.push("/auth/customer")}
            className="hidden text-sm font-medium text-slate-400 transition-colors hover:text-slate-100 sm:inline-flex px-2"
          >
            Sign in
          </button>

          <button
            onClick={() => router.push("/auth/customer")}
            className="rounded-full bg-teal-500 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition-all hover:bg-teal-400"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  FAQ Accordion Item                                         */
/* ──────────────────────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
          {q}
        </span>
        <ChevronRight
          size={16}
          className={`flex-shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-40 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {a}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Main Page (wrapped in ThemeProvider)                        */
/* ──────────────────────────────────────────────────────────── */
function LandingContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Gradient blurs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-teal-500/[0.07] blur-[120px]" />
          <div className="absolute top-20 -right-40 h-[400px] w-[400px] rounded-full bg-blue-500/[0.05] blur-[100px]" />
          <div className="absolute bottom-0 -left-40 h-[350px] w-[350px] rounded-full bg-purple-500/[0.05] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/80 px-4 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 backdrop-blur-sm">
            <Sparkles size={13} className="text-teal-500" />
            The Future of Fair LPG Distribution is here
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block">Book Fair.</span>
            <span className="block text-teal-500">
              Distribute Smart.
            </span>
            <span className="block">Serve Everyone.</span>
          </h1>

          {/* Sub-heading */}
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
            GasSafe is an intelligent command center for LPG distribution.
            Leverage AI-powered priority scoring to ensure every household gets
            their cylinder fairly and on time.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={() => router.push("/auth/customer")}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:bg-teal-400 hover:shadow-teal-400/30 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-7 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <section className="border-y border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4">
          <p className="pt-5 text-center text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-600">
            Trusted by India&apos;s Leading Gas Networks
          </p>
          <Marquee />
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 sm:grid-cols-4 sm:px-6">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="group text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 transition-all duration-300 hover:border-teal-400/40 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-500 transition-transform duration-300 group-hover:scale-110">
                <Icon size={20} />
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-3xl">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
              <Zap size={13} />
              Powerful Features
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Everything you need for{" "}
              <span className="text-teal-500">
                fair distribution
              </span>
            </h2>
            <p className="mt-4 text-base text-slate-500 dark:text-slate-400">
              From role-based access to AI-powered anomaly detection — GasSafe
              covers every aspect of modern LPG logistics.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, color, bg, border }) => (
              <div
                key={title}
                className={`group relative rounded-2xl border bg-white dark:bg-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${border}`}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${bg} ${color}`}
                >
                  <Icon size={20} />
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section
        id="how-it-works"
        className="py-20 sm:py-24 scroll-mt-20 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/60"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/5 px-4 py-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
              <CheckCircle2 size={13} />
              Simple Process
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Get started in{" "}
              <span className="text-teal-500">
                three steps
              </span>
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {STEPS.map(({ num, title, description, icon: Icon }) => (
              <div
                key={num}
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-8 transition-all duration-300 hover:border-teal-400/40 hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="mb-4 block text-4xl font-black text-slate-200 dark:text-slate-800 transition-colors group-hover:text-teal-200 dark:group-hover:text-teal-900">
                  {num}
                </span>
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-500 transition-transform duration-300 group-hover:scale-110">
                  <Icon size={18} />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ACCESS PORTALS ═══ */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Choose your{" "}
              <span className="text-teal-500">
                portal
              </span>
            </h2>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Every role gets a dedicated, secure dashboard experience.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                role: "Customer",
                href: "/auth/customer",
                icon: Flame,
                desc: "Book cylinders, track delivery queue, view distributor map, and chat with the AI assistant.",
                gradient: "from-teal-500/10 to-transparent",
                border: "border-teal-500/20 hover:border-teal-400/50",
                iconColor: "text-teal-500 bg-teal-400/10",
                btn: "bg-teal-500 hover:bg-teal-400 shadow-teal-500/20",
                badge: "OTP Login",
                badgeBg: "bg-teal-400/10 text-teal-600 dark:text-teal-400 border-teal-400/20",
              },
              {
                role: "Distributor",
                href: "/auth/distributor",
                icon: Truck,
                desc: "Manage priority queue, update stock, monitor demand heatmaps, and view delivery schedules.",
                gradient: "from-emerald-500/10 to-transparent",
                border: "border-emerald-500/20 hover:border-emerald-400/50",
                iconColor: "text-emerald-500 bg-emerald-400/10",
                btn: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20",
                badge: "Credential Login",
                badgeBg: "bg-emerald-400/10 text-emerald-700 dark:text-emerald-400 border-emerald-400/20",
              },
              {
                role: "Admin",
                href: "/auth/admin",
                icon: ShieldCheck,
                desc: "Control crisis levels, review suspicious activity, explore AI insights and network analytics.",
                gradient: "from-green-600/10 to-transparent",
                border: "border-green-600/20 hover:border-green-500/50",
                iconColor: "text-green-600 bg-green-500/10",
                btn: "bg-green-600 hover:bg-green-500 shadow-green-600/20",
                badge: "Restricted Access",
                badgeBg: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
              },
            ].map(({ role, href, icon: Icon, desc, gradient, border, iconColor, btn, badge, badgeBg }) => (
              <div
                key={role}
                onClick={() => router.push(href)}
                className={`group relative cursor-pointer rounded-2xl border bg-gradient-to-b ${gradient} bg-white dark:bg-slate-900/60 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${border}`}
              >
                <span className={`mb-4 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeBg}`}>
                  {badge}
                </span>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconColor}`}>
                  <Icon size={22} />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">{role}</h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
                <button
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 ${btn}`}
                >
                  Continue as {role}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRIORITY SCORING EXPLAINER ═══ */}
      <section className="py-20 sm:py-24 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200/60 dark:border-slate-800/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              How{" "}
              <span className="text-teal-500">
                Priority Scoring
              </span>{" "}
              Works
            </h2>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              A transparent, auditable algorithm ensures nobody games the system.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { factor: "Days Since Last Booking", points: "Up to 40 pts", desc: "The longer you've waited, the higher your score.", color: "border-teal-500/30 bg-teal-500/5" },
              { factor: "BPL Household Status", points: "+25 pts", desc: "Subsidised households get an automatic boost.", color: "border-amber-500/30 bg-amber-500/5" },
              { factor: "Urgency Type", points: "+12 to +35 pts", desc: "Medical (+35) > BPL (+24) > Regular (+12).", color: "border-rose-500/30 bg-rose-500/5" },
            ].map(({ factor, points, desc, color }) => (
              <div key={factor} className={`rounded-2xl border p-6 ${color} transition-all hover:-translate-y-0.5`}>
                <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{points}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{factor}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            <strong className="text-slate-700 dark:text-slate-300">Max Score = 100.</strong>{" "}
            Higher scores → lower queue positions → faster delivery.
          </p>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section id="faq" className="py-20 sm:py-24 scroll-mt-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-6 divide-slate-200 dark:divide-slate-800">
            {FAQ.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA FOOTER ═══ */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-teal-500/[0.06] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Ready to experience{" "}
            <span className="text-teal-500">
              fair distribution
            </span>
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-500 dark:text-slate-400">
            Join the GasSafe network today. Whether you&apos;re a customer, distributor,
            or administrator — there&apos;s a portal waiting for you.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={() => router.push("/auth/customer")}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:bg-teal-400 hover:shadow-teal-400/30 hover:-translate-y-0.5"
            >
              Get Started — Free
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => router.push("/auth/distributor")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5"
            >
              Partner with Us
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-slate-200/60 dark:border-slate-800/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white">
              <Fuel size={12} />
            </span>
            <span className="text-slate-900 dark:text-slate-100">GasSafe</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} GasSafe — Smart &amp; Fair LPG Distribution Platform.
            Maharashtra Gas Distribution Network.
          </p>
          <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-500">
            <a href="#" className="transition hover:text-teal-500">Privacy</a>
            <a href="#" className="transition hover:text-teal-500">Terms</a>
            <a href="#" className="transition hover:text-teal-500">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Default Export (wraps everything in ThemeProvider)          */
/* ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <ThemeProvider>
      <LandingContent />
    </ThemeProvider>
  );
}
