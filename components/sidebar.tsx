"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Menu, X, LogOut,
  LayoutDashboard, Flame, ClipboardList,
  Truck, ShieldCheck, Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/hooks/use-app-store";
import { ROLE_LINKS, ROLE_LABELS } from "@/lib/auth";

// Map icon name strings to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Flame,
  ClipboardList,
  Truck,
  ShieldCheck,
  Brain,
};

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();

  const role   = useAppStore((s) => s.role);
  const logout = useAppStore((s) => s.logout);

  const links      = ROLE_LINKS[role]  ?? [];
  const roleLabel  = ROLE_LABELS[role] ?? role;
  const rolePillClass =
    role === "customer"
      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
      : role === "distributor"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
      : "bg-violet-500/20 text-violet-300 border-violet-500/30";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        aria-label="Toggle sidebar"
        className="fixed left-3 top-3 z-40 rounded-md bg-slate-800 p-2 text-slate-100 md:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-slate-800 bg-slate-950 px-2 py-4 transition-transform duration-300 md:w-14 md:translate-x-0 md:px-1 xl:w-60 xl:px-3",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="mb-4 px-2 md:px-1 xl:px-2">
          <h1 className="text-xl font-bold text-teal-400 md:text-center xl:text-left">⛽ <span className="hidden xl:inline">GasSafe</span></h1>
          <p className="mt-0.5 hidden text-xs text-slate-500 xl:block">Smart LPG Distribution</p>
        </div>

        <div className="mb-3 border-t border-slate-800/40" />

        {/* Navigation links */}
        <nav className="flex-1 space-y-0.5">
          {links.map((link) => {
            const Icon     = ICON_MAP[link.icon];
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md border-l-[3px] px-2 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "border-l-teal-400 bg-teal-500/15 text-teal-300"
                    : "border-l-transparent text-slate-500 hover:bg-teal-500/8 hover:text-slate-200"
                )}
              >
                {Icon && (
                  <Icon
                    size={16}
                    className={isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"}
                  />
                )}
                <span className="hidden flex-1 xl:inline">{link.label}</span>
                {isActive && (
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-teal-400 xl:inline" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="my-3 border-t border-slate-800/40" />

        <div className="mb-3 hidden rounded-lg border border-slate-800 bg-slate-900/80 p-3 xl:block">
          <p className="text-[11px] uppercase tracking-wide text-slate-500">Signed in as</p>
          <p className="mt-1 text-sm font-medium text-slate-200">{roleLabel}</p>
          <span className={cn("mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium", rolePillClass)}>
            {role}
          </span>
        </div>

        {/* Sign out */}
        <div className="mt-4 border-t border-slate-800 pt-4">
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2.5 text-sm text-slate-400 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={16} />
            <span className="hidden xl:inline">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
