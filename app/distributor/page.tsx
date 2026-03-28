"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { AlertTriangle, CheckCircle2, Package, Truck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { DistributorSmartQueue } from "@/components/distributor-smart-queue";
import { useAppStore } from "@/hooks/use-app-store";
import { Booking } from "@/types";

type BookingWithHousehold = Booking & {
  household?: {
    name?: string;
    address?: string;
    bpl?: boolean;
    lastBookingDate?: string;
    pincode?: string;
  };
};

export default function DistributorPage() {
  const markDelivered = useAppStore((s) => s.markDelivered);
  const updateStock = useAppStore((s) => s.updateStock);
  const stateBookings = useAppStore((s) => s.bookings);

  const [dbBookings, setDbBookings] = useState<BookingWithHousehold[]>([]);
  const [distributorId, setDistributorId] = useState<string>("dist-1");
  const [stock, setStock] = useState("45");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"ml" | "all">("ml");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const heatmapData = useMemo(() => {
    const demandByPin = new Map<string, number>();

    dbBookings.forEach((booking) => {
      const pincode = booking.household?.pincode;
      if (!pincode) return;
      demandByPin.set(pincode, (demandByPin.get(pincode) ?? 0) + 1);
    });

    return Array.from(demandByPin.entries()).map(([pincode, demand]) => ({
      pincode,
      demand,
    }));
  }, [dbBookings]);

  const allBookings = useMemo(() => {
    return [...dbBookings].sort(
      (a, b) =>
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );
  }, [dbBookings]);

  const summary = useMemo(() => {
    const pending = dbBookings.filter((b) => b.status === "pending").length;
    const delivered = dbBookings.filter((b) => b.status === "delivered").length;
    const activeDeliveries = Math.max(0, Math.floor(pending * 0.35));
    const stockValue = Number(stock) || 0;
    const lowStock = stockValue < 20;
    return { pending, delivered, activeDeliveries, lowStock };
  }, [dbBookings, stock]);

  const inventoryRows = useMemo(
    () => [
      { type: "14kg Domestic", percent: Math.max(0, Math.min(100, Number(stock) || 0)), count: Number(stock) || 0 },
      { type: "5kg Domestic", percent: Math.max(0, Math.min(100, (Number(stock) || 0) * 0.65)), count: Math.max(0, Math.round((Number(stock) || 0) * 0.65)) },
      { type: "Commercial", percent: Math.max(0, Math.min(100, (Number(stock) || 0) * 0.4)), count: Math.max(0, Math.round((Number(stock) || 0) * 0.4)) },
    ],
    [stock]
  );

  // Load distributor's bookings from database
  useEffect(() => {
    async function loadBookings() {
      try {
        // Get this distributor's pending bookings
        const response = await fetch(`/api/db/distributors/${distributorId}`);
        if (!response.ok) throw new Error("Failed to fetch bookings");

        const bookings = await response.json();
        setDbBookings(bookings);
      } catch (err) {
        console.error("Failed to load distributor bookings:", err);
        // Fall back to mock data
        const myBookings = stateBookings.filter(
          (b) => b.distributorId === distributorId
        );
        setDbBookings(myBookings);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookings();
  }, [distributorId, stateBookings]);

  const saveStock = () => {
    updateStock(distributorId, Number(stock));
    toast.success("Stock availability updated");
  };

  const handleMarkDelivered = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/db/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });

      if (!response.ok) {
        throw new Error("Failed to persist delivery status");
      }

      setDbBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: "delivered" } : booking
        )
      );

      // Keep local app store in sync for components still using Zustand booking state.
      markDelivered(bookingId);
      return true;
    } catch (error) {
      console.error("Failed to mark delivery in DB:", error);
      toast.error("Failed to mark delivery. Please try again.");
      return false;
    }
  };

  return (
    <RoleGuard>
      <AppShell>
        <h2 className="mb-4 text-2xl font-bold">Distributor Panel</h2>

        <div className="sticky top-14 z-10 mb-4 grid gap-2 rounded-xl border border-slate-800 bg-slate-900/95 p-3 backdrop-blur sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 border-slate-800/50 px-1 xl:border-r">
            <span className="rounded-lg bg-amber-500/15 p-2 text-amber-300"><Package size={16} /></span>
            <div>
              <p className="text-xl font-semibold text-slate-100">{summary.pending}</p>
              <p className="text-xs text-slate-400">Pending Orders</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-slate-800/50 px-1 xl:border-r">
            <span className="rounded-lg bg-blue-500/15 p-2 text-blue-300"><Truck size={16} /></span>
            <div>
              <p className="text-xl font-semibold text-slate-100">{summary.activeDeliveries}</p>
              <p className="text-xs text-slate-400">Active Deliveries</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-slate-800/50 px-1 xl:border-r">
            <span className={`rounded-lg p-2 ${summary.lowStock ? "bg-red-500/15 text-red-300" : "bg-teal-500/15 text-teal-300"}`}>
              <AlertTriangle size={16} />
            </span>
            <div>
              <p className="text-xl font-semibold text-slate-100">{summary.lowStock ? "YES" : "NO"}</p>
              <p className="text-xs text-slate-400">Low Stock Alert</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-1">
            <span className="rounded-lg bg-green-500/15 p-2 text-green-300"><CheckCircle2 size={16} /></span>
            <div>
              <p className="text-xl font-semibold text-slate-100">{summary.delivered}</p>
              <p className="text-xs text-slate-400">Today's Completed</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("ml")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "ml"
                ? "border-b-2 border-teal-500 text-teal-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            🤖 Smart Queue (ML-Optimized)
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "border-b-2 border-teal-500 text-teal-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            📋 All Bookings Received
          </button>
        </div>

        {/* Smart Queue Tab (ML-Powered) */}
        {activeTab === "ml" && (
          <div>
            <DistributorSmartQueue
              bookings={dbBookings}
              onMarkDelivered={handleMarkDelivered}
            />
          </div>
        )}

        {/* All Bookings Tab */}
        {activeTab === "all" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  All Distributor Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3 py-4">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-10 animate-pulse rounded-md bg-slate-800/70" />
                    ))}
                  </div>
                ) : allBookings.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    No bookings assigned to this distributor yet.
                  </div>
                ) : (
                  <>
                    <div className="hidden overflow-x-auto md:block">
                      <Table>
                        <THead>
                          <TR>
                            <TH>Date</TH>
                            <TH>Customer</TH>
                            <TH>Urgency</TH>
                            <TH>Cylinders</TH>
                            <TH>ML Score</TH>
                            <TH>Queue</TH>
                            <TH>Status</TH>
                          </TR>
                        </THead>
                        <TBody>
                          {allBookings.map((booking) => (
                            <TR key={booking.id}>
                              <TD>{booking.requestDate}</TD>
                              <TD>{booking.household?.name ?? booking.householdId}</TD>
                              <TD>
                                <span className="capitalize">{booking.urgency}</span>
                              </TD>
                              <TD>{booking.cylindersRequested}</TD>
                              <TD>
                                <Badge
                                  variant={
                                    booking.priorityScore >= 70
                                      ? "danger"
                                      : booking.priorityScore >= 40
                                      ? "warning"
                                      : "success"
                                  }
                                >
                                  {booking.priorityScore.toFixed(1)}
                                </Badge>
                              </TD>
                              <TD>#{booking.queuePosition}</TD>
                              <TD>
                                <Badge
                                  variant={
                                    booking.status === "delivered"
                                      ? "success"
                                      : "warning"
                                  }
                                >
                                  {booking.status}
                                </Badge>
                              </TD>
                            </TR>
                          ))}
                        </TBody>
                      </Table>
                    </div>

                    <div className="space-y-3 md:hidden">
                      {allBookings.map((booking) => (
                        <div key={booking.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-100">{booking.household?.name ?? booking.householdId}</p>
                            <Badge
                              variant={
                                booking.priorityScore >= 70
                                  ? "danger"
                                  : booking.priorityScore >= 40
                                  ? "warning"
                                  : "default"
                              }
                            >
                              {booking.priorityScore.toFixed(1)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                            <p>Date: <span className="text-slate-200">{booking.requestDate}</span></p>
                            <p>Queue: <span className="text-slate-200">#{booking.queuePosition}</span></p>
                            <p>Urgency: <span className="capitalize text-slate-200">{booking.urgency}</span></p>
                            <p>
                              Status:{" "}
                              <span className="text-slate-200">{booking.status}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stock & Analytics (shown in both tabs) */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Panel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  id="stock-input"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  type="number"
                  min={0}
                />
                <Button id="save-stock-btn" onClick={saveStock}>
                  Save
                </Button>
              </div>

              <div className="space-y-3">
                {inventoryRows.map((row) => {
                  const colorClass =
                    row.percent < 20
                      ? "bg-red-500"
                      : row.percent < 50
                      ? "bg-amber-500"
                      : "bg-[var(--accent)]";

                  return (
                    <div key={row.type}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                        <span>{row.type}</span>
                        <span className="text-slate-200">{row.count} units</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${row.percent}%` }} />
                      </div>
                      {row.percent < 20 && (
                        <Button size="sm" variant="secondary" className="mt-2">Restock</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demand Heatmap by PIN</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] w-full md:h-[280px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={heatmapData}>
                    <XAxis dataKey="pincode" stroke="var(--foreground)" tick={{ fill: "var(--foreground)", fontSize: 11 }} />
                    <YAxis stroke="var(--foreground)" tick={{ fill: "var(--foreground)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        color: "#f1f5f9",
                      }}
                    />
                    <Bar dataKey="demand" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full animate-pulse rounded-md bg-slate-800" />
              )}
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </RoleGuard>
  );
}
