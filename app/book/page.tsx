"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SimpleDialog } from "@/components/ui/dialog";
import { distributors, households } from "@/data/mock-data";
import { calculatePriorityScore } from "@/lib/priority";
import { useAppStore } from "@/hooks/use-app-store";
import { UrgencyType } from "@/types";

export default function BookPage() {
  const user = households[0];
  const addBooking = useAppStore((s) => s.addBooking);
  const [distributorId, setDistributorId] = useState(distributors[0].id);
  const [urgency, setUrgency] = useState<UrgencyType>("medical");
  const [open, setOpen] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  const result = useMemo(
    () =>
      calculatePriorityScore({
        lastBookingDate: user.lastBookingDate,
        isBpl: user.bpl,
        urgency,
      }),
    [urgency, user.bpl, user.lastBookingDate]
  );

  const submit = () => {
    const queue = Math.max(1, 15 - Math.floor(result.score / 8));
    setQueuePosition(queue);
    addBooking({
      id: `bk-${Math.floor(Math.random() * 9000 + 1000)}`,
      householdId: user.id,
      distributorId,
      requestDate: new Date().toISOString().split("T")[0],
      cylindersRequested: 1,
      urgency,
      queuePosition: queue,
      status: "pending",
      priorityScore: result.score,
    });
    setOpen(true);
    toast.success("Booking submitted to fair queue system.");
  };

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Book Cylinder</h1>
      <Card>
        <CardHeader>
          <CardTitle>Transparent Booking Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Address</label>
            <Input value={user.address} readOnly />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Distributor</label>
            <Select value={distributorId} onChange={(e) => setDistributorId(e.target.value)}>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.pincode})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Urgency</label>
            <Select value={urgency} onChange={(e) => setUrgency(e.target.value as UrgencyType)}>
              <option value="medical">Medical</option>
              <option value="bpl">BPL Household</option>
              <option value="regular">Regular</option>
            </Select>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
            Your score is <span className="font-bold text-teal-300">{result.score}</span> because:
            <ul className="mt-2 list-disc pl-5">
              <li>Last booking: {result.breakdown.days} days ago</li>
              <li>BPL: {user.bpl ? "Yes" : "No"}</li>
              <li>Urgency: {urgency}</li>
            </ul>
          </div>
          <Button onClick={submit}>Submit Booking</Button>
        </CardContent>
      </Card>

      <SimpleDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Booking Confirmed"
        description={
          <div>
            <p>Queue position: #{queuePosition}</p>
            <p className="mt-1">Your request is visible in the distributor fair-priority queue.</p>
          </div>
        }
      />
    </AppShell>
  );
}
