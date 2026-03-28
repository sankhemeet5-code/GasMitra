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
import { bookings, distributors, households } from "@/data/mock-data";
import { useAppStore } from "@/hooks/use-app-store";

export default function DistributorPage() {
  const markDelivered = useAppStore((s) => s.markDelivered);
  const updateStock   = useAppStore((s) => s.updateStock);
  const stateBookings = useAppStore((s) => s.bookings);
  const [stock, setStock]     = useState("45");
  const [mounted, setMounted] = useState(false);
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const pendingRows = useMemo(() => {
    const sorted = stateBookings
      .filter((b) => b.status === "pending")
      .sort((a, b) => b.priorityScore - a.priorityScore);
    return highPriorityOnly ? sorted.filter((b) => b.priorityScore >= 70) : sorted;
  }, [stateBookings, highPriorityOnly]);

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((b) => {
      const hh = households.find((h) => h.id === b.householdId);
      if (!hh) return;
      map.set(hh.pincode, (map.get(hh.pincode) ?? 0) + 1);
    });
    return [...map.entries()].map(([pincode, demand]) => ({ pincode, demand }));
  }, []);

  const saveStock = () => {
    updateStock(distributors[0].id, Number(stock));
    toast.success("Stock availability updated");
  };

  return (
    <RoleGuard>
      <AppShell>
        {/* Header row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Distributor Panel</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">High Priority Only</span>
            <button
              id="high-priority-toggle"
              onClick={() => setHighPriorityOnly((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                highPriorityOnly ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  highPriorityOnly ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Priority Queue (Highest First)
              {pendingRows.length === 0 && (
                <Badge variant="warning">All delivered</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {pendingRows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
                <span className="text-4xl">🎉</span>
                <p className="font-medium text-slate-300">No pending deliveries</p>
                <p className="text-sm">
                  {highPriorityOnly
                    ? "No high-priority requests right now — toggle filter to see all."
                    : "All deliveries have been marked as completed."}
                </p>
              </div>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Household</TH>
                    <TH>Address</TH>
                    <TH>Priority Score</TH>
                    <TH>Last Booking</TH>
                    <TH>Cylinders</TH>
                    <TH />
                  </TR>
                </THead>
                <TBody>
                  {pendingRows.map((booking, idx) => {
                    const hh      = households.find((h) => h.id === booking.householdId);
                    const isTop3  = idx < 3;
                    if (!hh) return null;
                    return (
                      <TR
                        key={booking.id}
                        className={isTop3 ? "bg-amber-500/5" : ""}
                      >
                        <TD>
                          <span className={isTop3 ? "font-semibold text-amber-200" : ""}>
                            {isTop3 && "🔥 "}
                            {hh.name}
                          </span>
                        </TD>
                        <TD>{hh.address}</TD>
                        <TD>
                          <span
                            className={`font-semibold ${
                              booking.priorityScore >= 70
                                ? "text-red-400"
                                : booking.priorityScore >= 40
                                ? "text-amber-400"
                                : "text-teal-300"
                            }`}
                          >
                            {booking.priorityScore}
                          </span>
                        </TD>
                        <TD>{hh.lastBookingDate}</TD>
                        <TD>{booking.cylindersRequested}</TD>
                        <TD>
                          <Button
                            size="sm"
                            onClick={() => {
                              markDelivered(booking.id);
                              toast.success(`Delivery marked for ${hh.name}`);
                            }}
                          >
                            Mark Delivered
                          </Button>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
              <Button id="save-stock-btn" onClick={saveStock}>Save</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demand Heatmap by PIN</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmapData}>
                    <XAxis dataKey="pincode" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" }}
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
