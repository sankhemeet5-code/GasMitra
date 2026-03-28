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
import { ROLE_LINKS, ROLE_LABELS, ROLE_COLORS } from "@/lib/auth";

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
  const badgeClass = ROLE_COLORS[role] ?? "";

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
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-800 bg-slate-950 p-4 transition-transform duration-300 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-teal-400">⛽ GasSafe</h1>
          <p className="mt-0.5 text-xs text-slate-600">Smart LPG Distribution</p>
        </div>

        {/* Role badge */}
        <div
          className={cn(
            "mb-5 rounded-lg border px-3 py-2 text-xs font-medium",
            badgeClass
          )}
        >
          Logged in as {roleLabel}
        </div>

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
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-teal-500/15 text-teal-300"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
                )}
              >
                {Icon && (
                  <Icon
                    size={16}
                    className={isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"}
                  />
                )}
                <span className="flex-1">{link.label}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="mt-4 border-t border-slate-800 pt-4">
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-400 transition-all duration-150 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
