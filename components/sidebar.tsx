"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/book", label: "Book Cylinder" },
  { href: "/bookings", label: "My Bookings" },
  { href: "/distributor", label: "Distributor Panel" },
  { href: "/admin", label: "Admin Panel" },
  { href: "/ai-insights", label: "AI Insights" },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="fixed left-3 top-3 z-40 rounded-md bg-slate-800 p-2 text-slate-100 md:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={18} />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-800 bg-slate-950 p-4 transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <h1 className="mb-6 text-xl font-bold text-teal-400">GasSafe</h1>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
