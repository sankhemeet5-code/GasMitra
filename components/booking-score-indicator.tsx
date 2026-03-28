"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { CrisisLevel, UrgencyType } from "@/types";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/hooks/use-app-store";

interface BookingScoreIndicatorProps {
  lastBookingDate: string;
  isBpl: boolean;
  urgency: UrgencyType;
  stock: number;
  queuePosition: number;
}

interface ScoreResponse {
  predicted_priority_score: number;
  priority_band: "low" | "medium" | "high";
  source: string;
}

const BAND_COLORS = {
  high: {
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    text: "text-red-300",
    badge: "bg-red-500",
  },
  medium: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    text: "text-amber-300",
    badge: "bg-amber-500",
  },
  low: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/40",
    text: "text-teal-300",
    badge: "bg-teal-500",
  },
};

export function BookingScoreIndicator({
  lastBookingDate,
  isBpl,
  urgency,
  stock,
  queuePosition,
}: BookingScoreIndicatorProps) {
  const crisisLevel = useAppStore((s) => s.crisisLevel);
  const [score, setScore] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchScore() {
      setLoading(true);
      try {
        const now = new Date();
        const date = new Date(lastBookingDate);
        const days = Math.floor(
          (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );

        const response = await fetch("/api/ml/priority", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            days_since_last_booking: Math.max(0, days),
            is_bpl: isBpl ? 1 : 0,
            urgency,
            crisis_level: crisisLevel,
            cylinders_requested: 1,
            stock_at_distributor: stock,
            queue_position: queuePosition,
            location_changes_30d: 0,
            booking_gap_days: Math.max(0, days - 2),
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as ScoreResponse;
          setScore(data);
        }
      } catch (error) {
        console.error("Failed to fetch score:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchScore();
  }, [lastBookingDate, isBpl, urgency, crisisLevel, stock, queuePosition]);

  if (!score) {
    return (
      <div className="flex items-center justify-center py-4 text-slate-400">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Computing your priority score...
          </>
        ) : null}
      </div>
    );
  }

  const colors = BAND_COLORS[score.priority_band];

  return (
    <Card className={`border ${colors.border} ${colors.bg} p-4`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">
            Your Priority Score
          </span>
          <Badge className={`${colors.badge} text-white`}>
            {score.priority_band.toUpperCase()}
          </Badge>
        </div>

        <div className={`text-3xl font-bold ${colors.text}`}>
          {score.predicted_priority_score.toFixed(1)}
        </div>

        <Progress value={score.predicted_priority_score} />

        <p className="text-xs text-slate-400">
          {score.priority_band === "high" &&
            "🔴 High priority: You're near the top of the queue. Expect faster delivery."}
          {score.priority_band === "medium" &&
            "🟡 Medium priority: Standard queue position. Moderate wait time expected."}
          {score.priority_band === "low" &&
            "🟢 Low priority: General queue. Consider medical or BPL status if applicable."}
        </p>

        <div className="pt-2 text-xs text-slate-500">
          Source: {score.source === "ml-service" ? "ML Model" : "Calculated"}
        </div>
      </div>
    </Card>
  );
}
