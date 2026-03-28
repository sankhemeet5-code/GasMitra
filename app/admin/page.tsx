"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, BellRing, Boxes, ShieldAlert, Users } from "lucide-react";
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
import { Booking, CrisisLevel, Distributor, RebookingRequest } from "@/types";

const DistributorMap = dynamic(
  () => import("@/components/distributor-map").then((m) => m.DistributorMap),
  { ssr: false }
);

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
  { label: "Total bookings today", value: "138", icon: Boxes, trend: "+6.2%", up: true },
  { label: "Cylinders distributed", value: "104", icon: Users, trend: "+4.1%", up: true },
  { label: "Flagged accounts", value: "11", icon: ShieldAlert, trend: "-1.8%", up: false },
  { label: "System alerts", value: "7", icon: BellRing, trend: "+2.3%", up: false },
];

export default function AdminPage() {
  const mockCrisisLevel = useAppStore((s) => s.crisisLevel);
  const setMockCrisisLevel = useAppStore((s) => s.setCrisisLevel);

  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("normal");
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "requests">("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsBookings, setAnalyticsBookings] = useState<BookingForAnalytics[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [requests, setRequests] = useState<RebookingRequest[]>([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);
  const [requestActionId, setRequestActionId] = useState<string | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Load crisis level from database
  useEffect(() => {
    async function loadCrisisLevel() {
      try {
        const [crisisResponse, dataResponse] = await Promise.all([
          fetch("/api/db/crisis"),
          fetch("/api/db/data"),
        ]);

        if (!crisisResponse.ok) throw new Error("Failed to fetch crisis level");
        const crisisData = await crisisResponse.json();
        setCrisisLevel(crisisData.crisisLevel);

        if (dataResponse.ok) {
          const data = await dataResponse.json();
          setDistributors(data.distributors ?? []);
        }
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

  useEffect(() => {
    async function loadRequests() {
      if (activeTab !== "requests") {
        return;
      }

      try {
        setIsRequestsLoading(true);
        const response = await fetch("/api/db/rebooking-requests?status=pending", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch lock-period requests");
        }

        const data = (await response.json()) as RebookingRequest[];
        setRequests(data);
      } catch (err) {
        console.error("Failed to load lock-period requests:", err);
        toast.error("Failed to load lock-period requests");
        setRequests([]);
      } finally {
        setIsRequestsLoading(false);
      }
    }

    loadRequests();
  }, [activeTab]);

  const handleReviewRequest = async (requestId: string, decision: "approved" | "rejected") => {
    try {
      setRequestActionId(requestId);
      const response = await fetch(`/api/db/rebooking-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      if (!response.ok) {
        throw new Error("Failed to review request");
      }

      setRequests((prev) => prev.filter((req) => req.id !== requestId));
      toast.success(
        decision === "approved"
          ? "Request approved and moved to distributor queue"
          : "Request rejected"
      );
    } catch (err) {
      console.error("Failed to review request:", err);
      toast.error("Failed to process request");
    } finally {
      setRequestActionId(null);
    }
  };

  return (
    <RoleGuard>
      <AppShell>
        <h2 className="mb-4 text-2xl font-bold">Admin Panel</h2>

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
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "requests"
                ? "border-b-2 border-teal-500 text-teal-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            📝 Lock-Period Requests
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

            {/* Stat cards with hover animation */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {STAT_CARDS.map(({ label, value, icon: Icon, trend, up }) => (
                <Card
                  key={label}
                  className="relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600"
                >
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-teal-400/40" />
                  <CardHeader>
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-300">
                      <Icon size={16} />
                    </div>
                    <CardTitle className="text-sm text-slate-400">
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-100">{value}</p>
                    <div className={`mt-3 inline-flex items-center gap-1 text-xs ${up ? "text-emerald-300" : "text-red-300"}`}>
                      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {trend}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Distributor Map (Maharashtra)</CardTitle>
              </CardHeader>
              <CardContent>
                <DistributorMap distributors={distributors} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suspiciousAlerts
                  .filter((alert) => !dismissedAlerts.includes(alert.id))
                  .sort((a, b) => (a.severity === "high" && b.severity !== "high" ? -1 : 0))
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start justify-between gap-3 rounded-lg border p-3 ${
                        alert.severity === "high"
                          ? "border-red-500/40 bg-red-500/10"
                          : "border-amber-500/40 bg-amber-500/10"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 ${alert.severity === "high" ? "text-red-300" : "text-amber-300"}`}>
                          <AlertTriangle size={16} />
                        </span>
                        <div>
                          <p className="text-sm text-slate-100">{alert.message}</p>
                          <p className="mt-1 text-xs text-slate-400">Just now</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setDismissedAlerts((prev) => [...prev, alert.id])
                        }
                      >
                        Dismiss
                      </Button>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <AdminAnalytics
            bookings={analyticsBookings}
            loading={isAnalyticsLoading}
          />
        )}

        {activeTab === "requests" && (
          <Card>
            <CardHeader>
              <CardTitle>Rebooking Approval Queue</CardTitle>
            </CardHeader>
            <CardContent>
              {isRequestsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-10 animate-pulse rounded bg-slate-800/60" />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-400">
                  No pending lock-period requests.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Request ID</TH>
                        <TH>Household</TH>
                        <TH>Distributor</TH>
                        <TH>Urgency</TH>
                        <TH>Requested At</TH>
                        <TH>Action</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {requests.map((req) => (
                        <TR key={req.id}>
                          <TD className="text-xs text-slate-400">{req.id}</TD>
                          <TD>{req.household?.name ?? req.householdId}</TD>
                          <TD>{req.distributor?.name ?? req.distributorId}</TD>
                          <TD>
                            <Badge
                              variant={
                                req.urgency === "medical"
                                  ? "danger"
                                  : req.urgency === "bpl"
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {req.urgency}
                            </Badge>
                          </TD>
                          <TD>{new Date(req.requestedAt).toLocaleString()}</TD>
                          <TD>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                disabled={requestActionId === req.id}
                                onClick={() => handleReviewRequest(req.id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={requestActionId === req.id}
                                onClick={() => handleReviewRequest(req.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </AppShell>
    </RoleGuard>
  );
}