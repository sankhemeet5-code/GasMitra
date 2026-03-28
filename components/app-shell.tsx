"use client";

import { ReactNode } from "react";
import { Bell, CircleUserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { CustomerChatbot } from "@/components/customer-chatbot";
import { useAppStore } from "@/hooks/use-app-store";

export function AppShell({ children }: { children: ReactNode }) {
  const role = useAppStore((s) => s.role);
  const pathname = usePathname();
  const router = useRouter();

  const titleMap: Record<string, string> = {
    "/dashboard": "Customer Dashboard",
    "/book": "Book Cylinder",
    "/bookings": "My Bookings",
    "/distributor": "Distributor Panel",
    "/admin": "Admin Panel",
    "/ai-insights": "AI Insights",
  };

  const pageTitle = titleMap[pathname] ?? "GasSafe";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="md:pl-14 xl:pl-60">
        <header className="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/85 backdrop-blur md:px-4 xl:px-6">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between pl-10 md:pl-0">
            <h1 className="truncate text-lg font-bold text-slate-100">{pageTitle}</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => toast.info("No new notifications")}
                className="pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-200"
              >
                <Bell size={18} />
              </button>
              <button
                type="button"
                aria-label="Account"
                onClick={() => router.push(role === "customer" ? "/dashboard" : role === "distributor" ? "/distributor" : "/admin")}
                className="pointer-events-auto flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-100"
              >
                <CircleUserRound size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-4 md:p-6 xl:p-8">
          {children}
        </div>
      </main>

      {/* Floating chatbot — customer role only */}
      {role === "customer" && <CustomerChatbot />}
    </div>
  );
}
