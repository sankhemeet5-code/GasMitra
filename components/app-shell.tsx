"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { CustomerChatbot } from "@/components/customer-chatbot";
import { useAppStore } from "@/hooks/use-app-store";

export function AppShell({ children }: { children: ReactNode }) {
  const role = useAppStore((s) => s.role);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="md:pl-64">
        <div className="mx-auto max-w-7xl p-4 pt-16 md:p-8">
          {children}
        </div>
      </main>

      {/* Floating chatbot — customer role only */}
      {role === "customer" && <CustomerChatbot />}
    </div>
  );
}
