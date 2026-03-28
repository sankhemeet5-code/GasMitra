"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppStore } from "@/hooks/use-app-store";
import { ROUTE_ROLES, ROLE_HOME } from "@/lib/auth";

/**
 * Client-side role guard — secondary safety net after middleware.
 * Shows a spinner while Zustand rehydrates from localStorage,
 * then redirects if the current route isn't allowed for this role.
 */
export function RoleGuard({ children }: { children: React.ReactNode }) {
  const role     = useAppStore((s) => s.role);
  const pathname = usePathname();
  const router   = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // Signal that the client has hydrated Zustand from localStorage
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    const allowedRoles = ROUTE_ROLES[pathname];
    if (allowedRoles && !allowedRoles.includes(role)) {
      router.replace(ROLE_HOME[role]);
    }
  }, [hydrated, role, pathname, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
