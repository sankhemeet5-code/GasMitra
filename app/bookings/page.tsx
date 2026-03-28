"use client";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useAppStore } from "@/hooks/use-app-store";
import { distributors } from "@/data/mock-data";
import Link from "next/link";

export default function BookingsPage() {
  const bookings   = useAppStore((s) => s.bookings);
  const myBookings = bookings.filter((b) => b.householdId === "hh-1");

  return (
    <RoleGuard>
      <AppShell>
        <h1 className="mb-4 text-2xl font-bold">My Bookings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {myBookings.length === 0 ? (
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
                    <TH>Distributor</TH>
                    <TH>Queue</TH>
                    <TH>Status</TH>
                  </TR>
                </THead>
                <TBody>
                  {myBookings.map((booking) => (
                    <TR key={booking.id}>
                      <TD>{booking.requestDate}</TD>
                      <TD>
                        {distributors.find((d) => d.id === booking.distributorId)?.name ?? "—"}
                      </TD>
                      <TD>#{booking.queuePosition}</TD>
                      <TD>
                        <Badge variant={booking.status === "delivered" ? "success" : "warning"}>
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
      </AppShell>
    </RoleGuard>
  );
}
