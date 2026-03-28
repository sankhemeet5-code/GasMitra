"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { DashboardPredictionsTab } from "@/components/dashboard-predictions-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CrisisBanner } from "@/components/crisis-banner";
import { calculatePriorityScore } from "@/lib/priority";
import { useCountdown } from "@/hooks/use-countdown";
import { useAppStore } from "@/hooks/use-app-store";
import { Household, Distributor, CrisisLevel } from "@/types";

const DistributorMap = dynamic(
  () => import("@/components/distributor-map").then((m) => m.DistributorMap),
  { ssr: false }
);

const STAT_CARDS = [
  { label: "Your Priority Score", key: "score" },
  { label: "Next Eligible Booking Date", key: "date" },
  { label: "Cylinders Available Near You", key: "cylinders" },
  { label: "Estimated Wait Time", key: "wait" },
];

export default function DashboardPage() {
  const mockCrisisLevel = useAppStore((s) => s.crisisLevel);
  const [user, setUser] = useState<Household | null>(null);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("normal");
  const [activeTab, setActiveTab] = useState<"overview" | "predictions">("overview");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/db/data");
        if (!response.ok) throw new Error("Failed to load data");

        const data = await response.json();
        setDistributors(data.distributors);
        setCrisisLevel(data.crisisLevel);
        if (data.households.length > 0) {
          setUser(data.households[0]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        // Fall back to mock data
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const score = user
    ? calculatePriorityScore({
        lastBookingDate: user.lastBookingDate,
        isBpl: user.bpl,
        urgency: "medical",
      }).score
    : 0;

  const [cooldownEnd] = useState(() => new Date(Date.now() + 3 * 60 * 60 * 1000));
  const countdown = useCountdown(cooldownEnd);

  const progressValue = countdown.isExpired ? 100 : 45;

  const statValues: Record<string, string> = {
    score: score.toString(),
    date: "30 Mar 2026",
    cylinders: "184",
    wait: "18 hours",
  };

  if (isLoading) {
    return (
      <RoleGuard>
        <AppShell>
          <h1 className="mb-4 text-2xl font-bold">Customer Dashboard</h1>
          <Card>
            <CardContent className="py-8 text-center text-slate-400">
              Loading your dashboard...
            </CardContent>
          </Card>
        </AppShell>
      </RoleGuard>
    );
  }

  if (!user) {
    return (
      <RoleGuard>
        <AppShell>
          <h1 className="mb-4 text-2xl font-bold">Customer Dashboard</h1>
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-4 text-amber-300">
              Unable to load customer profile. Please try refreshing the page.
            </CardContent>
          </Card>
        </AppShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard>
      <AppShell>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customer Dashboard</h1>
            <p className="mt-0.5 text-sm text-slate-400">
              Welcome back, <span className="text-slate-200">{user.name}</span>
            </p>
          </div>
          <div
            id="customer-role-badge"
            className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1.5 text-sm text-teal-300"
          >
            <User size={14} />
            Logged in as Customer
          </div>
        </div>

        <div className="mb-4 flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "overview"
                ? "border-b-2 border-teal-400 text-teal-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("predictions")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "predictions"
                ? "border-b-2 border-teal-400 text-teal-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            ML Predictions
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STAT_CARDS.map(({ label, key }) => (
                <Card
                  key={label}
                  className="transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-lg"
                >
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-400">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl font-bold text-teal-300">
                    {statValues[key]}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4">
              <CrisisBanner level={crisisLevel} />
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Distributor Map (Maharashtra)</CardTitle>
              </CardHeader>
              <CardContent>
                <DistributorMap distributors={distributors} />
                <div className="mt-3 flex gap-2 text-xs">
                  <Badge variant="success">High stock</Badge>
                  <Badge variant="warning">Medium stock</Badge>
                  <Badge variant="danger">Low stock</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Booking Access</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:max-w-sm">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-slate-300">
                      {countdown.isExpired ? (
                        <span className="text-teal-300 font-medium">✅ You are eligible to book!</span>
                      ) : (
                        <>
                          Cooldown active — book in{" "}
                          <span className="font-semibold text-amber-300">{countdown.text}</span>
                        </>
                      )}
                    </span>
                    <span className="ml-2 text-xs text-slate-500">{progressValue}%</span>
                  </div>
                  <Progress value={progressValue} />
                  <p className="mt-2 text-xs text-slate-500">
                    30-day fair distribution cycle — eligibility resets automatically
                  </p>
                </div>
                <Link href="/book">
                  <Button id="book-cylinder-btn" disabled={!countdown.isExpired} className="whitespace-nowrap">
                    {countdown.isExpired ? "Book Cylinder" : "🔒 Booking Locked"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "predictions" && (
          <DashboardPredictionsTab
            household={user}
            distributors={distributors}
            crisisLevel={crisisLevel}
          />
        )}
      </AppShell>
    </RoleGuard>
  );
}
