"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, Loader2 } from "lucide-react";
import { Household, Distributor, PriorityPredictionRequest, PriorityPredictionResponse } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDaysSince } from "@/lib/priority";

const BAND_COLORS = {
  high: "text-red-300",
  medium: "text-amber-300",
  low: "text-teal-300",
} as const;

function computeDaysSince(dateISO: string): number {
  const now = new Date();
  const date = new Date(dateISO);
  const ms = Math.max(now.getTime() - date.getTime(), 0);
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function DashboardPredictionsTab({
  household,
  distributors,
  crisisLevel,
}: {
  household: Household;
  distributors: Distributor[];
  crisisLevel: "normal" | "alert" | "emergency";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PriorityPredictionResponse | null>(null);

  // Compute request payload from household and distributor data
  const payload = useMemo(() => {
    const daysSince = computeDaysSince(household.lastBookingDate);
    const nearestDist = distributors[0]; // Use first distributor as nearest for now

    return {
      days_since_last_booking: daysSince,
      is_bpl: household.bpl ? 1 : 0,
      urgency: "medical" as const,
      crisis_level: crisisLevel,
      cylinders_requested: 1,
      stock_at_distributor: nearestDist?.stock ?? 50,
      queue_position: 5,
      location_changes_30d: 0,
      booking_gap_days: daysSince - 2,
    } as PriorityPredictionRequest;
  }, [household, distributors, crisisLevel]);

  // Auto-fetch prediction on mount and when payload changes
  useEffect(() => {
    async function fetchPrediction() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/ml/priority", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as PriorityPredictionResponse & { error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to fetch prediction.");
        }

        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Prediction error.");
        setResult(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPrediction();
  }, [payload]);

  const pressureData = useMemo(
    () => [
      {
        metric: "Demand",
        value: Math.min(100, Math.round((payload.days_since_last_booking / 60) * 100)),
      },
      {
        metric: "Queue",
        value: Math.min(100, Math.round((payload.queue_position / 10) * 100)),
      },
      {
        metric: "Stock",
        value: Math.max(0, 100 - Math.round((payload.stock_at_distributor / 100) * 100)),
      },
    ],
    [payload]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ML-Based Priority Prediction
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input summary */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Input Scenario</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Days Since Last Booking:</span>
                <span className="font-medium text-teal-300">{payload.days_since_last_booking}</span>
              </div>
              <div className="flex justify-between">
                <span>BPL Household:</span>
                <span className="font-medium text-teal-300">{payload.is_bpl ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span>Crisis Level:</span>
                <span className="font-medium uppercase text-amber-300">{payload.crisis_level}</span>
              </div>
              <div className="flex justify-between">
                <span>Stock at Nearest Distributor:</span>
                <span className="font-medium text-teal-300">{payload.stock_at_distributor} cylinders</span>
              </div>
              <div className="flex justify-between">
                <span>Queue Position:</span>
                <span className="font-medium text-teal-300">#{payload.queue_position}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-3 flex gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {result && (
            <>
              {/* Prediction result */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Predicted Priority Score</p>
                  <p className={`mt-2 text-4xl font-bold ${BAND_COLORS[result.priority_band]}`}>
                    {result.predicted_priority_score.toFixed(2)}
                  </p>
                  <div className="mt-3">
                    <Progress value={result.predicted_priority_score} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      variant={
                        result.priority_band === "high"
                          ? "danger"
                          : result.priority_band === "medium"
                            ? "warning"
                            : "success"
                      }
                    >
                      {result.priority_band.toUpperCase()} PRIORITY
                    </Badge>
                    <span className="text-xs text-slate-500">Source: {result.source}</span>
                  </div>
                  {result.note && <p className="mt-2 text-xs text-amber-300">{result.note}</p>}
                </div>

                <div className="w-full h-64 rounded-lg border border-slate-800 bg-slate-950/70 p-2" style={{ minHeight: "256px" }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={pressureData}>
                      <XAxis dataKey="metric" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={11} />
                      <Tooltip
                        cursor={{ fill: "rgba(100,116,139,0.12)" }}
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid #334155",
                          color: "#f8fafc",
                        }}
                      />
                      <Bar dataKey="value" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Explanation */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                <p className="font-medium text-slate-100 mb-2">What This Means</p>
                <p>
                  {result.priority_band === "high" &&
                    "🔴 Your priority score is HIGH. You're likely near the top of the queue and should expect delivery soon. Medical or BPL urgency combined with high demand increases your priority."}
                  {result.priority_band === "medium" &&
                    "🟡 Your priority score is MEDIUM. You're in the fair queue position. Regular usage patterns and moderate demand factors keep you in mid-priority range."}
                  {result.priority_band === "low" &&
                    "🟢 Your priority score is LOW. You're in the general queue. Consider booking during higher demand periods or verify your BPL/medical eligibility if applicable."}
                </p>
              </div>
            </>
          )}

          {loading && !result && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Loader2 className="mb-2 h-6 w-6 animate-spin" />
              <p className="text-sm">Fetching ML prediction...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
