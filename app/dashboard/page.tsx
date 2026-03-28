"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock3, Fuel, Gauge, CalendarClock, User } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { DashboardPredictionsTab } from "@/components/dashboard-predictions-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CrisisBanner } from "@/components/crisis-banner";
import { calculatePriorityScore } from "@/lib/priority";
import { useCountdown } from "@/hooks/use-countdown";
import { useAppStore } from "@/hooks/use-app-store";
import { Household, Distributor, CrisisLevel } from "@/types";

const STAT_CARDS = [
  { label: "Your Priority Score", key: "score", icon: Gauge },
  { label: "Next Eligible Booking Date", key: "date", icon: CalendarClock },
  { label: "Cylinders Available Near You", key: "cylinders", icon: Fuel },
  { label: "Estimated Wait Time", key: "wait", icon: Clock3 },
];

export default function DashboardPage() {
  const router = useRouter();
  const mockCrisisLevel = useAppStore((s) => s.crisisLevel);
  const storeBookings = useAppStore((s) => s.bookings);
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

  const latestBooking = storeBookings[0];
  const currentStep = latestBooking?.status === "delivered" ? 3 : latestBooking ? 1 : 0;
  const bookingSteps = ["Submitted", "Confirmed", "Out for Delivery", "Delivered"];

  if (isLoading) {
    return (
      <RoleGuard>
        <AppShell>
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" />
              ))}
            </div>
          </div>
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
            <h2 className="text-2xl font-bold">Customer Dashboard</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Welcome back, <span className="text-slate-200">{user.name}</span>
            </p>
          </div>
          <div
            id="customer-role-badge"
            className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-300"
          >
            <User size={14} />
            <span className="font-medium">{user.name}</span>
            <span className="text-blue-300/70">• Customer</span>
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
            <Card className="border-teal-400/20 bg-gradient-to-br from-slate-900 to-slate-900/60">
              <CardHeader>
                <CardTitle className="text-base">Current Booking Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <div>
                    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {bookingSteps.map((step, idx) => {
                        const completed = idx <= currentStep;
                        return (
                          <div key={step} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${completed ? "bg-teal-400" : "bg-slate-600"}`} />
                            <span className={`text-xs ${completed ? "text-slate-100" : "text-slate-500"}`}>{step}</span>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-sm text-slate-400">Estimated Delivery</p>
                    <p className="text-2xl font-semibold text-teal-300">Today, 6:30 PM</p>
                  </div>

                  <div className="flex items-end justify-start lg:justify-end">
                    <Button
                      id="track-booking-btn"
                      className="w-full sm:w-auto"
                      onClick={() => router.push("/bookings")}
                    >
                      Track Booking
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STAT_CARDS.map(({ label, key, icon: Icon }) => (
                <Card
                  key={label}
                  className="transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600"
                >
                  <CardHeader>
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300">
                      <Icon size={16} />
                    </div>
                    <CardTitle className="text-sm text-slate-400">{label}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold text-teal-300">
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
