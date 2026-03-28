"use client";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useAppStore } from "@/hooks/use-app-store";
import { distributors } from "@/data/mock-data";

export default function BookingsPage() {
  const bookings = useAppStore((s) => s.bookings);
  const myBookings = bookings.filter((booking) => booking.householdId === "hh-1");

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">My Bookings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
                  <TD>{distributors.find((d) => d.id === booking.distributorId)?.name}</TD>
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
        </CardContent>
      </Card>
    </AppShell>
  );
}
