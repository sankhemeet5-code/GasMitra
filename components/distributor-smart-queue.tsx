"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Booking } from "@/types";
import { toast } from "sonner";

type BookingWithHousehold = Booking & {
  household?: {
    name?: string;
    address?: string;
    bpl?: boolean;
  };
};

interface DistributorSmartQueueProps {
  bookings: BookingWithHousehold[];
  onMarkDelivered: (bookingId: string) => Promise<boolean>;
}

export function DistributorSmartQueue({
  bookings,
  onMarkDelivered,
}: DistributorSmartQueueProps) {
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  const pendingRows = useMemo(() => {
    const sorted = bookings
      .filter((b) => b.status === "pending")
      .sort((a, b) => b.priorityScore - a.priorityScore);
    return highPriorityOnly
      ? sorted.filter((b) => b.priorityScore >= 70)
      : sorted;
  }, [bookings, highPriorityOnly]);

  const stats = useMemo(() => {
    const total = bookings.filter((b) => b.status === "pending").length;
    const high = bookings.filter(
      (b) => b.status === "pending" && b.priorityScore >= 70
    ).length;
    const medium = bookings.filter(
      (b) =>
        b.status === "pending" &&
        b.priorityScore >= 40 &&
        b.priorityScore < 70
    ).length;
    const low = bookings.filter(
      (b) => b.status === "pending" && b.priorityScore < 40
    ).length;

    return { total, high, medium, low };
  }, [bookings]);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">
                {stats.total}
              </div>
              <div className="text-xs text-slate-400">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-300">{stats.high}</div>
              <div className="text-xs text-slate-400">High Priority</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-300">
                {stats.medium}
              </div>
              <div className="text-xs text-slate-400">Medium</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-teal-500/40 bg-teal-500/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">{stats.low}</div>
              <div className="text-xs text-slate-400">Low</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">ML-Optimized Queue</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">High Priority Only</span>
          <button
            id="ml-high-priority-toggle"
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

      {/* Queue Table */}
      <Card>
        <CardContent className="overflow-x-auto pt-6">
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
                  <TH>Customer Name</TH>
                  <TH>ML Score</TH>
                  <TH>Days Waiting</TH>
                  <TH>Urgency</TH>
                  <TH>BPL</TH>
                  <TH>Address</TH>
                  <TH />
                </TR>
              </THead>
              <TBody>
                {pendingRows.map((booking, idx) => {
                  const isTop3 = idx < 3;
                  const customerName = booking.household?.name ?? booking.householdId;
                  const customerAddress = booking.household?.address ?? "Address unavailable";
                  const customerBpl = booking.household?.bpl ?? false;

                  const now = new Date();
                  const bookDate = new Date(booking.requestDate);
                  const daysSince = Math.floor(
                    (now.getTime() - bookDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  return (
                    <TR
                      key={booking.id}
                      className={`${
                        isTop3 ? "bg-amber-500/10" : ""
                      } border-b border-slate-800`}
                    >
                      <TD>
                        <span className={isTop3 ? "font-semibold text-amber-200" : ""}>
                          {isTop3 && "🔥 "}
                          {customerName}
                        </span>
                      </TD>
                      <TD>
                        <Badge
                          className={
                            booking.priorityScore >= 70
                              ? "bg-red-500"
                              : booking.priorityScore >= 40
                              ? "bg-amber-500"
                              : "bg-teal-500"
                          }
                        >
                          {booking.priorityScore.toFixed(1)}
                        </Badge>
                      </TD>
                      <TD>{daysSince} d</TD>
                      <TD>
                        <Badge
                          variant={
                            booking.urgency === "medical"
                              ? "danger"
                              : booking.urgency === "bpl"
                              ? "warning"
                              : "default"
                          }
                        >
                          {booking.urgency}
                        </Badge>
                      </TD>
                      <TD>{customerBpl ? "✓" : "—"}</TD>
                      <TD className="text-xs text-slate-400">
                        {customerAddress.slice(0, 30)}...
                      </TD>
                      <TD>
                        <Button
                          size="sm"
                          disabled={processingBookingId === booking.id}
                          onClick={async () => {
                            setProcessingBookingId(booking.id);
                            const ok = await onMarkDelivered(booking.id);
                            if (ok) {
                              toast.success(`Delivery marked for ${customerName}`);
                            }
                            setProcessingBookingId(null);
                          }}
                        >
                          {processingBookingId === booking.id ? "Saving..." : "Deliver"}
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

      {/* Tips */}
      <Card className="bg-slate-900/50">
        <CardContent className="pt-6 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">💡 Smart Queue Tips:</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>
              Queue is sorted by ML-predicted priority score (highest first)
            </li>
            <li>
              🔥 Top 3 customers marked for optimized route planning
            </li>
            <li>Use filter to focus on high-priority deliveries (score ≥ 70)</li>
            <li>Score factors: wait time, BPL status, urgency, stock level</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
