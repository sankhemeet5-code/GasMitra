"use client";

import Link from "next/link";
import { useAppStore } from "@/hooks/use-app-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const setRole = useAppStore((s) => s.setRole);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-teal-400">
            GasSafe — Smart & Fair LPG Distribution
          </CardTitle>
          <p className="text-sm text-slate-300">
            Mock login to explore role-based crisis dashboards.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Link href="/dashboard">
            <Button className="w-full" onClick={() => setRole("user")}>
              Login as User
            </Button>
          </Link>
          <Link href="/distributor">
            <Button variant="secondary" className="w-full" onClick={() => setRole("distributor")}>
              Distributor
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="outline" className="w-full" onClick={() => setRole("admin")}>
              Admin
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
