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
import { UrgencyType, Household, Distributor } from "@/types";

export default function BookPage() {
  const addBooking = useAppStore((s) => s.addBooking);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [user, setUser] = useState<Household | null>(null);
  const [distributorId, setDistributorId] = useState("");
  const [urgency, setUrgency] = useState<UrgencyType>("medical");
  const [open, setOpen] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setUser(data.households[0]);
          setDistributorId(data.distributors[0].id);
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
      setIsLoading(true);

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
      setOpen(true);
      toast.success("Booking submitted to fair queue system.");
    } catch (err) {
      console.error("Booking failed:", err);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setIsLoading(false);
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
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Submit Booking"}
                </Button>
              </CardContent>
            </Card>

            <SimpleDialog
              open={open}
              onClose={() => setOpen(false)}
              title="Booking Confirmed ✅"
              description={
                <div>
                  <p>
                    Queue position: <strong>#{queuePosition}</strong>
                  </p>
                  <p className="mt-1 text-slate-400">
                    Your request is now visible in the distributor fair-priority queue.
                  </p>
                </div>
              }
            />
          </>
        )}
      </AppShell>
    </RoleGuard>
  );
}
