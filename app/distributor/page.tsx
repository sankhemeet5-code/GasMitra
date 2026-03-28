"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { bookings, distributors, households } from "@/data/mock-data";
import { useAppStore } from "@/hooks/use-app-store";

export default function DistributorPage() {
  const markDelivered = useAppStore((s) => s.markDelivered);
  const updateStock = useAppStore((s) => s.updateStock);
  const stateBookings = useAppStore((s) => s.bookings);
  const [stock, setStock] = useState("45");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pendingRows = useMemo(
    () =>
      stateBookings
        .filter((booking) => booking.status === "pending")
        .sort((a, b) => b.priorityScore - a.priorityScore),
    [stateBookings]
  );

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>();
    bookings.forEach((booking) => {
      const hh = households.find((item) => item.id === booking.householdId);
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
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Distributor Panel</h1>
      <Card>
        <CardHeader>
          <CardTitle>Priority Queue (Highest First)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <THead>
              <TR>
                <TH>Household Name</TH>
                <TH>Address</TH>
                <TH>Priority Score</TH>
                <TH>Last Booking</TH>
                <TH>Cylinders Requested</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {pendingRows.map((booking) => {
                const hh = households.find((h) => h.id === booking.householdId);
                if (!hh) return null;
                return (
                  <TR key={booking.id}>
                    <TD>{hh.name}</TD>
                    <TD>{hh.address}</TD>
                    <TD>{booking.priorityScore}</TD>
                    <TD>{hh.lastBookingDate}</TD>
                    <TD>{booking.cylindersRequested}</TD>
                    <TD>
                      <Button size="sm" onClick={() => markDelivered(booking.id)}>
                        Mark Delivered
                      </Button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Update Cylinder Availability</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input value={stock} onChange={(e) => setStock(e.target.value)} />
            <Button onClick={saveStock}>Save</Button>
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
                  <Tooltip />
                  <Bar dataKey="demand" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full animate-pulse rounded-md bg-slate-800" />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
