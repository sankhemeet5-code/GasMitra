"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SimpleDialog } from "@/components/ui/dialog";
import { BookingScoreIndicator } from "@/components/booking-score-indicator";
import { calculatePriorityScore } from "@/lib/priority";
import { useAppStore } from "@/hooks/use-app-store";
import { RebookingRequest, UrgencyType, Household, Distributor } from "@/types";

export default function BookPage() {
  const addBooking = useAppStore((s) => s.addBooking);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [user, setUser] = useState<Household | null>(null);
  const [distributorId, setDistributorId] = useState("");
  const [urgency, setUrgency] = useState<UrgencyType>("medical");
  const [open, setOpen] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [dialogMode, setDialogMode] = useState<"booking" | "request">("booking");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockStatus, setLockStatus] = useState<{
    isLocked: boolean;
    remainingDays: number;
    lastBookingDate: string | null;
    lockDays: number;
    maxRequests?: number;
    usedRequests?: number;
    remainingRequests?: number;
  } | null>(null);
  const [requestHistory, setRequestHistory] = useState<RebookingRequest[]>([]);

  // Fetch household and distributors data
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch("/api/db/data");
        if (!response.ok) throw new Error("Failed to load data");

        const data = await response.json();
        setDistributors(data.distributors);
        // Get first household as current user
        if (data.households.length > 0) {
          const currentUser = data.households[0];
          setUser(currentUser);
          setDistributorId(data.distributors[0].id);

          const lockResponse = await fetch(
            `/api/db/bookings?action=lock-status&householdId=${currentUser.id}`
          );

          if (lockResponse.ok) {
            const lock = await lockResponse.json();
            setLockStatus({
              ...lock,
              maxRequests: 2,
              usedRequests: 0,
              remainingRequests: 2,
            });
          }

          const reqResponse = await fetch(
            `/api/db/rebooking-requests?householdId=${currentUser.id}`,
            { cache: "no-store" }
          );

          if (reqResponse.ok) {
            const requests = (await reqResponse.json()) as RebookingRequest[];
            setRequestHistory(requests);

            if (lockResponse.ok) {
              const lock = await (await fetch(
                `/api/db/bookings?action=lock-status&householdId=${currentUser.id}`
              )).json();

              const lastDate = lock.lastBookingDate
                ? new Date(`${lock.lastBookingDate}T00:00:00.000Z`)
                : null;
              const usedInCycle = requests.filter((req) => {
                if (!lastDate) return true;
                return new Date(req.requestedAt) >= lastDate;
              }).length;

              setLockStatus({
                ...lock,
                maxRequests: 2,
                usedRequests: usedInCycle,
                remainingRequests: Math.max(0, 2 - usedInCycle),
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load household and distributor data");
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!user || requestHistory.length === 0) return;

    const key = `gasmitra-seen-reviews-${user.id}`;
    const seen = new Set(
      (typeof window !== "undefined" ? localStorage.getItem(key) : "")
        ?.split(",")
        .filter(Boolean) ?? []
    );

    const reviewed = requestHistory.filter(
      (req) => (req.status === "approved" || req.status === "rejected") && !seen.has(req.id)
    );

    if (reviewed.length === 0) return;

    reviewed.forEach((req) => {
      if (req.status === "approved") {
        toast.success(`Request ${req.id} approved by admin.`);
      } else {
        toast.error(`Request ${req.id} rejected by admin.`);
      }
      seen.add(req.id);
    });

    if (typeof window !== "undefined") {
      localStorage.setItem(key, Array.from(seen).join(","));
    }
  }, [requestHistory, user]);

  const result = useMemo(
    () =>
      user
        ? calculatePriorityScore({
            lastBookingDate: user.lastBookingDate,
            isBpl: user.bpl,
            urgency,
          })
        : { score: 0, breakdown: { days: 0 } },
    [urgency, user?.bpl, user?.lastBookingDate, user]
  );

  const submit = async () => {
    if (!user || !user.id) {
      toast.error("User not loaded");
      return;
    }

    try {
      setIsSubmitting(true);

      // Call ML prediction orchestration endpoint
      const queuePos = Math.max(1, 15 - Math.floor(result.score / 8));

      const predictionResponse = await fetch("/api/ml/predict-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: user.id,
          distributorId,
          urgency,
          cylindersRequested: 1,
          queuePosition: queuePos,
        }),
      });

      if (!predictionResponse.ok) {
        throw new Error("Failed to get ML prediction");
      }

      const { prediction } = await predictionResponse.json();

      if (lockStatus?.isLocked) {
        const requestResponse = await fetch("/api/db/rebooking-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            householdId: user.id,
            distributorId,
            urgency,
            cylindersRequested: 1,
            priorityScore: prediction.predicted_priority_score,
            priorityBand: prediction.priority_band,
            mlSource: prediction.source,
            reviewNote: `Requested within ${lockStatus.lockDays}-day lock period (${lockStatus.remainingDays} day(s) remaining).`,
          }),
        });

        if (!requestResponse.ok) {
          const errorData = await requestResponse.json().catch(() => ({}));
          if (errorData?.code === "REQUEST_LIMIT_REACHED") {
            throw new Error("You have reached the 2-request limit for this lock period.");
          }
          throw new Error("Failed to submit approval request");
        }

        const requestData = await requestResponse.json();
        setDialogMode("request");
        setRequestId(requestData.request?.id ?? null);
        setLockStatus((prev) =>
          prev
            ? {
                ...prev,
                usedRequests: requestData.allowance?.usedRequests ?? prev.usedRequests,
                remainingRequests:
                  requestData.allowance?.remainingRequests ?? prev.remainingRequests,
              }
            : prev
        );
        setRequestHistory((prev) =>
          requestData.request ? [requestData.request, ...prev] : prev
        );
        setOpen(true);
        toast.success("Approval request submitted to admin.");
        return;
      }

      // Create booking in database
      const bookingResponse = await fetch("/api/db/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdId: user.id,
          distributorId,
          urgency,
          cylindersRequested: 1,
          priorityScore: prediction.predicted_priority_score,
          priorityBand: prediction.priority_band,
          mlSource: prediction.source,
        }),
      });

      if (!bookingResponse.ok) {
        throw new Error("Failed to create booking");
      }

      const booking = await bookingResponse.json();

      // Update local store for UI consistency
      addBooking({
        id: booking.id,
        householdId: user.id,
        distributorId,
        requestDate: new Date().toISOString().split("T")[0],
        cylindersRequested: 1,
        urgency,
        queuePosition: queuePos,
        status: "pending",
        priorityScore: prediction.predicted_priority_score,
      });

      setQueuePosition(queuePos);
      setDialogMode("booking");
      setOpen(true);
      toast.success("Booking submitted to fair queue system.");
    } catch (err) {
      console.error("Booking failed:", err);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard>
      <AppShell>
        <h1 className="mb-4 text-2xl font-bold">Book Cylinder</h1>

        {isLoading && (
          <Card>
            <CardContent className="py-8 text-center text-slate-400">
              Loading your profile and available distributors...
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="py-4 text-red-300">{error}</CardContent>
          </Card>
        )}

        {!isLoading && !error && user && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Transparent Booking Form</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Address</label>
                  <Input id="booking-address" value={user.address} readOnly />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Distributor</label>
                  <Select
                    id="booking-distributor"
                    value={distributorId}
                    onChange={(e) => setDistributorId(e.target.value)}
                  >
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.pincode})
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">Urgency</label>
                  <Select
                    id="booking-urgency"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as UrgencyType)}
                  >
                    <option value="medical">Medical</option>
                    <option value="bpl">BPL Household</option>
                    <option value="regular">Regular</option>
                  </Select>
                </div>

                {lockStatus?.isLocked && (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
                    You are in a {lockStatus.lockDays}-day lock-in period.
                    <span className="ml-1 font-medium">
                      {lockStatus.remainingDays} day(s) remaining.
                    </span>
                    <p className="mt-1 text-xs text-amber-300/90">
                      You can submit up to {lockStatus.maxRequests ?? 2} approval requests.
                      Remaining in this lock cycle: {lockStatus.remainingRequests ?? 0}.
                    </p>
                  </div>
                )}

                {requestHistory.length > 0 && (
                  <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
                    <p className="mb-2 text-sm font-medium text-slate-200">
                      Your Lock-Period Requests
                    </p>
                    <div className="space-y-2">
                      {requestHistory.slice(0, 3).map((req) => (
                        <div key={req.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{req.id}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${
                              req.status === "approved"
                                ? "bg-teal-500/20 text-teal-300"
                                : req.status === "rejected"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ML-Based Real-Time Score */}
                <div className="pt-2">
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    ML-Predicted Priority
                  </label>
                  <BookingScoreIndicator
                    lastBookingDate={user.lastBookingDate}
                    isBpl={user.bpl}
                    urgency={urgency}
                    stock={distributors.find((d) => d.id === distributorId)?.stock ?? 50}
                    queuePosition={Math.max(1, 15 - Math.floor(result.score / 8))}
                  />
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
                  Traditional calculation score:{" "}
                  <span className="font-bold text-teal-300">{result.score}</span>
                  <ul className="mt-2 list-disc pl-5 space-y-0.5">
                    <li>Last booking: {result.breakdown.days} days ago</li>
                    <li>BPL household: {user.bpl ? "Yes (+25)" : "No (+5)"}</li>
                    <li>Urgency: {urgency}</li>
                  </ul>
                </div>

                <Button
                  id="submit-booking-btn"
                  onClick={submit}
                  disabled={
                    isSubmitting ||
                    isLoading ||
                    Boolean(lockStatus?.isLocked && (lockStatus.remainingRequests ?? 0) <= 0)
                  }
                >
                  {isSubmitting
                    ? "Processing..."
                    : lockStatus?.isLocked
                    ? (lockStatus.remainingRequests ?? 0) > 0
                      ? "Submit Approval Request"
                      : "Request Limit Reached"
                    : "Submit Booking"}
                </Button>
              </CardContent>
            </Card>

            <SimpleDialog
              open={open}
              onClose={() => setOpen(false)}
              title={dialogMode === "booking" ? "Booking Confirmed ✅" : "Approval Request Submitted ✅"}
              description={
                dialogMode === "booking" ? (
                  <div>
                    <p>
                      Queue position: <strong>#{queuePosition}</strong>
                    </p>
                    <p className="mt-1 text-slate-400">
                      Your request is now visible in the distributor fair-priority queue.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p>Your request has been sent to Admin for lock-period approval.</p>
                    {requestId && (
                      <p className="mt-1 text-xs text-slate-400">Request ID: {requestId}</p>
                    )}
                    <p className="mt-1 text-slate-400">
                      Once approved, it will automatically appear in the distributor queue.
                    </p>
                  </div>
                )
              }
            />
          </>
        )}
      </AppShell>
    </RoleGuard>
  );
}
