"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
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
  const [sortBy, setSortBy] = useState<"priority" | "time">("priority");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const pendingRows = useMemo(() => {
    const sorted = bookings.filter((b) => b.status === "pending").sort((a, b) => {
      if (sortBy === "priority") {
        return b.priorityScore - a.priorityScore;
      }
      return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
    });
    return highPriorityOnly
      ? sorted.filter((b) => b.priorityScore >= 70)
      : sorted;
  }, [bookings, highPriorityOnly, sortBy]);

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
          <button
            onClick={() => setSortBy((prev) => (prev === "priority" ? "time" : "priority"))}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-700 px-2.5 text-xs text-slate-300 transition-colors duration-150 hover:bg-slate-800"
          >
            <ArrowUpDown size={14} />
            Sort: {sortBy === "priority" ? "Priority" : "Booking Time"}
          </button>
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
        <CardContent className="pt-6">
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
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <THead>
                    <TR>
                      <TH>Customer</TH>
                      <TH>Priority</TH>
                      <TH>Status</TH>
                      <TH>Booking Time</TH>
                      <TH>Address</TH>
                      <TH>Actions</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {pendingRows.map((booking, idx) => {
                      const isTop3 = idx < 3;
                      const customerName = booking.household?.name ?? booking.householdId;
                      const customerAddress = booking.household?.address ?? "Address unavailable";

                      const priorityMeta =
                        booking.priorityScore >= 70
                          ? { label: "High", dot: "bg-red-400" }
                          : booking.priorityScore >= 40
                          ? { label: "Medium", dot: "bg-amber-400" }
                          : { label: "Normal", dot: "bg-slate-400" };

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
                            <div className="flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${priorityMeta.dot}`} />
                              <span className="text-sm text-slate-200">{priorityMeta.label}</span>
                            </div>
                          </TD>
                          <TD>
                            <Badge variant="warning">pending</Badge>
                          </TD>
                          <TD>{booking.requestDate}</TD>
                          <TD className="text-xs text-slate-400">
                            {customerAddress.length > 36 ? `${customerAddress.slice(0, 36)}...` : customerAddress}
                          </TD>
                          <TD>
                            <div className="relative flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setOpenMenuId((prev) =>
                                    prev === booking.id ? null : booking.id
                                  )
                                }
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition-colors duration-150 hover:bg-slate-800"
                                aria-label="Order actions"
                              >
                                <MoreHorizontal size={16} />
                              </button>
                              {openMenuId === booking.id && (
                                <div className="absolute right-11 top-0 z-20 w-44 rounded-md border border-slate-700 bg-slate-900 p-1 text-xs shadow-lg">
                                  <button className="w-full rounded px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800">Assign Driver</button>
                                  <button className="w-full rounded px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800">Mark Confirmed</button>
                                  <button className="w-full rounded px-2 py-1.5 text-left text-slate-300 hover:bg-slate-800">View Details</button>
                                  <button className="w-full rounded px-2 py-1.5 text-left text-red-300 hover:bg-red-500/10">Cancel</button>
                                </div>
                              )}

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
                            </div>
                          </TD>
                        </TR>
                      );
                    })}
                  </TBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {pendingRows.map((booking) => {
                  const customerName = booking.household?.name ?? booking.householdId;
                  const priorityMeta =
                    booking.priorityScore >= 70
                      ? { label: "High", dot: "bg-red-400" }
                      : booking.priorityScore >= 40
                      ? { label: "Medium", dot: "bg-amber-400" }
                      : { label: "Normal", dot: "bg-slate-400" };

                  return (
                    <div key={booking.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-100">{customerName}</p>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${priorityMeta.dot}`} />
                          <span className="text-xs text-slate-300">{priorityMeta.label}</span>
                        </div>
                      </div>
                      <div className="mb-3 text-xs text-slate-400">
                        <p>Booking Time: <span className="text-slate-200">{booking.requestDate}</span></p>
                        <p>Status: <span className="text-amber-300">pending</span></p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
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
                    </div>
                  );
                })}
              </div>
            </>
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
