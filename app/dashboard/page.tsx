"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CrisisBanner } from "@/components/crisis-banner";
import { distributors, households } from "@/data/mock-data";
import { calculatePriorityScore } from "@/lib/priority";
import { useCountdown } from "@/hooks/use-countdown";
import { useAppStore } from "@/hooks/use-app-store";

const DistributorMap = dynamic(
  () => import("@/components/distributor-map").then((m) => m.DistributorMap),
  { ssr: false }
);

export default function DashboardPage() {
  const crisisLevel = useAppStore((s) => s.crisisLevel);
  const user = households[0];
  const score = calculatePriorityScore({
    lastBookingDate: user.lastBookingDate,
    isBpl: user.bpl,
    urgency: "medical",
  }).score;

  const [cooldownEnd] = useState(() => new Date(Date.now() + 3 * 60 * 60 * 1000));
  const countdown = useCountdown(cooldownEnd);

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">User Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Your Priority Score", score.toString()],
          ["Next Eligible Booking Date", "30 Mar 2026"],
          ["Cylinders Available Near You", "184"],
          ["Estimated Wait Time", "18 hours"],
        ].map(([title, value]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-bold text-teal-300">{value}</CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4">
        <CrisisBanner level={crisisLevel} />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Distributor Map (Maharashtra)</CardTitle>
        </CardHeader>
        <CardContent>
          <DistributorMap distributors={distributors} />
          <div className="mt-3 flex gap-2 text-xs">
            <Badge variant="success">High stock</Badge>
            <Badge variant="warning">Medium stock</Badge>
            <Badge variant="danger">Low stock</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Booking Access</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <p className="mb-2 text-sm text-slate-300">
              Cooldown active: book in{" "}
              <span className="font-semibold text-amber-300">{countdown.text}</span>
            </p>
            <Progress value={countdown.isExpired ? 100 : 45} />
          </div>
          <Link href="/book">
            <Button disabled={!countdown.isExpired}>
              {countdown.isExpired ? "Book Cylinder" : "Booking Locked"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </AppShell>
  );
}
