"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useAppStore } from "@/hooks/use-app-store";
import Link from "next/link";
import { Booking } from "@/types";

const getScoreBadgeColor = (score: number) => {
  if (score >= 70) return "bg-red-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-teal-500";
};

const getScoreBand = (score: number) => {
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
};

export default function BookingsPage() {
  const mockBookings = useAppStore((s) => s.bookings);
  const [dbBookings, setDbBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load bookings from database
  useEffect(() => {
    async function loadBookings() {
      try {
        // Get first household (current user)
        const dataResponse = await fetch("/api/db/data");
        if (!dataResponse.ok) throw new Error("Failed to fetch households");

        const { households } = await dataResponse.json();
        if (!households || households.length === 0) {
          setDbBookings([]);
          setIsLoading(false);
          return;
        }

        const firstHousehold = households[0];

        // Fetch this household's bookings
        const bookingsResponse = await fetch(
          `/api/db/bookings?householdId=${firstHousehold.id}`
        );
        if (!bookingsResponse.ok) throw new Error("Failed to fetch bookings");

        const bookings = await bookingsResponse.json();
        setDbBookings(bookings);
      } catch (err) {
        console.error("Failed to load bookings:", err);
        setError("Failed to load bookings");
        // Fall back to mock data
        const myMockBookings = mockBookings.filter((b) => b.householdId === "hh-1");
        setDbBookings(myMockBookings);
      } finally {
        setIsLoading(false);
      }
    }
    loadBookings();
  }, [mockBookings]);

  return (
    <RoleGuard>
      <AppShell>
        <h1 className="mb-4 text-2xl font-bold">My Bookings</h1>

        {isLoading && (
          <Card>
            <CardContent className="py-8 text-center text-slate-400">
              Loading your bookings...
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-4 text-amber-300">
              {error} (Showing cached data)
            </CardContent>
          </Card>
        )}

        {!isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {dbBookings.length === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center gap-3 py-14 text-center text-slate-500">
                  <span className="text-5xl">📦</span>
                  <p className="text-lg font-medium text-slate-300">No bookings yet</p>
                  <p className="max-w-xs text-sm">
                    You haven&#39;t booked any cylinders. Head over to Book Cylinder to place your first request.
                  </p>
                  <Link href="/book">
                    <Button id="go-book-btn" className="mt-2">
                      Book Your First Cylinder →
                    </Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Date</TH>
                      <TH>Urgency</TH>
                      <TH>ML Score</TH>
                      <TH>Priority</TH>
                      <TH>Queue</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {dbBookings.map((booking) => (
                      <TR key={booking.id}>
                        <TD>
                          {new Date(booking.requestDate).toLocaleDateString()}
                        </TD>
                        <TD>
                          <span className="capitalize">{booking.urgency}</span>
                        </TD>
                        <TD>
                          <Badge className={getScoreBadgeColor(booking.priorityScore)}>
                            {booking.priorityScore.toFixed(1)}
                          </Badge>
                        </TD>
                        <TD>
                          <span className="text-sm font-medium">
                            {getScoreBand(booking.priorityScore)}
                          </span>
                        </TD>
                        <TD>#{booking.queuePosition}</TD>
                        <TD>
                          <Badge
                            variant={
                              booking.status === "delivered"
                                ? "success"
                                : booking.status === "cancelled"
                                ? "danger"
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
        )}
      </AppShell>
    </RoleGuard>
  );
}
