"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminAnalytics } from "@/components/admin-analytics";
import { suspiciousAlerts } from "@/data/mock-data";
import { useAppStore } from "@/hooks/use-app-store";
import { Booking, CrisisLevel } from "@/types";

type BookingForAnalytics = Booking & {
  household?: {
    pincode?: string;
    name?: string;
  };
  distributor?: {
    name?: string;
    pincode?: string;
  };
};

const levels: CrisisLevel[] = ["normal", "alert", "emergency"];

const STAT_CARDS = [
  { label: "Total bookings today", value: "138" },
  { label: "Cylinders distributed", value: "104" },
  { label: "Flagged accounts", value: "11" },
  { label: "Shortage areas", value: "Aurangabad, Mumbai" },
];

export default function AdminPage() {
  const mockCrisisLevel = useAppStore((s) => s.crisisLevel);
  const setMockCrisisLevel = useAppStore((s) => s.setCrisisLevel);

  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("normal");
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics">("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsBookings, setAnalyticsBookings] = useState<BookingForAnalytics[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  // Load crisis level from database
  useEffect(() => {
    async function loadCrisisLevel() {
      try {
        const response = await fetch("/api/db/crisis");
        if (!response.ok) throw new Error("Failed to fetch crisis level");

        const data = await response.json();
        setCrisisLevel(data.crisisLevel);
      } catch (err) {
        console.error("Failed to load crisis level:", err);
        // Fall back to mock data
        setCrisisLevel(mockCrisisLevel);
      } finally {
        setIsLoading(false);
      }
    }
    loadCrisisLevel();
  }, [mockCrisisLevel]);

  const handleSetCrisisLevel = async (level: CrisisLevel) => {
    try {
      const response = await fetch("/api/db/crisis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });

      if (!response.ok) throw new Error("Failed to update crisis level");

      const data = await response.json();
      setCrisisLevel(data.crisisLevel);
      setMockCrisisLevel(level); // Keep mock store in sync
      toast.success(`Crisis level set to ${level}`);
    } catch (err) {
      console.error("Failed to update crisis level:", err);
      toast.error("Failed to update crisis level");
    }
  };

  const isEmergency = crisisLevel === "emergency";

  useEffect(() => {
    async function loadAnalyticsBookings() {
      if (activeTab !== "analytics") {
        return;
      }

      try {
        setIsAnalyticsLoading(true);
        const response = await fetch("/api/db/bookings?action=pending", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch analytics bookings");
        }

        const data = (await response.json()) as BookingForAnalytics[];
        setAnalyticsBookings(data);
      } catch (err) {
        console.error("Failed to load analytics bookings:", err);
        toast.error("Failed to load SQLite analytics data");
        setAnalyticsBookings([]);
      } finally {
        setIsAnalyticsLoading(false);
      }
    }

    loadAnalyticsBookings();
  }, [activeTab]);

  return (
    <RoleGuard>
      <AppShell>
        <h1 className="mb-4 text-2xl font-bold">Admin Panel</h1>

        {/* Tab Navigation */}
        <div className="mb-4 flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "dashboard"
                ? "border-b-2 border-teal-500 text-teal-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            📊 System Dashboard
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "analytics"
                ? "border-b-2 border-teal-500 text-teal-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            🤖 Predictive Analytics
          </button>
        </div>

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            {/* Emergency warning banner */}
            {isEmergency && (
              <div
                id="emergency-banner"
                className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300"
              >
                <span className="text-xl">🚨</span>
                <div>
                  <p className="font-semibold">Emergency Mode Active</p>
                  <p className="text-sm text-red-400">
                    All resources are being prioritised for medical and BPL
                    households. Override standard queue logic with caution.
                  </p>
                </div>
              </div>
            )}

            {/* Crisis level control */}
            <Card>
              <CardHeader>
                <CardTitle>Crisis Level Control</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <Button
                    key={level}
                    id={`crisis-btn-${level}`}
                    variant={level === crisisLevel ? "default" : "secondary"}
                    onClick={() => handleSetCrisisLevel(level)}
                    disabled={isLoading}
                    className={
                      level === "emergency" && crisisLevel === "emergency"
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : ""
                    }
                  >
                    {level === "emergency" && "🚨 "}
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Suspicious alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Suspicious Accounts Alerts</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Alert</TH>
                      <TH>Severity</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {suspiciousAlerts.map((alert) => (
                      <TR key={alert.id}>
                        <TD>{alert.message}</TD>
                        <TD>
                          <Badge
                            variant={
                              alert.severity === "high" ? "danger" : "warning"
                            }
                          >
                            {alert.severity}
                          </Badge>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>

            {/* Stat cards with hover animation */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STAT_CARDS.map(({ label, value }) => (
                <Card
                  key={label}
                  className="transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50"
                >
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-400">
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="font-semibold text-teal-300">
                    {value}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <AdminAnalytics
            bookings={analyticsBookings}
            loading={isAnalyticsLoading}
          />
        )}
      </AppShell>
    </RoleGuard>
  );
}