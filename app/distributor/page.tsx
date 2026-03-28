"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
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
        <h1 className="mb-4 text-2xl font-bold">Distributor Panel</h1>

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
              <CardContent className="overflow-x-auto">
                {isLoading ? (
                  <div className="py-8 text-center text-slate-400">
                    Loading distributor bookings...
                  </div>
                ) : allBookings.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    No bookings assigned to this distributor yet.
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stock & Analytics (shown in both tabs) */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Update Cylinder Availability</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demand Heatmap by PIN</CardTitle>
            </CardHeader>
            <CardContent className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={heatmapData}>
                    <XAxis dataKey="pincode" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        color: "#f1f5f9",
                      }}
                    />
                    <Bar dataKey="demand" fill="#14b8a6" radius={[4, 4, 0, 0]} />
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
