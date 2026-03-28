"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PriorityPredictionRequest, PriorityPredictionResponse } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";

const DEFAULT_FORM: PriorityPredictionRequest = {
  days_since_last_booking: 22,
  is_bpl: 1,
  urgency: "medical",
  crisis_level: "alert",
  cylinders_requested: 1,
  stock_at_distributor: 40,
  queue_position: 14,
  location_changes_30d: 0,
  booking_gap_days: 20,
};

const BAND_COLORS = {
  high: "text-red-300",
  medium: "text-amber-300",
  low: "text-teal-300",
} as const;

function toInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function MlPriorityPanel() {
  const [form, setForm] = useState<PriorityPredictionRequest>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PriorityPredictionResponse | null>(null);

  const scenarioData = useMemo(
    () => [
      {
        metric: "Demand pressure",
        value: Math.min(100, Math.round((form.days_since_last_booking / 60) * 100)),
      },
      {
        metric: "Queue pressure",
        value: Math.min(100, Math.round((form.queue_position / 150) * 100)),
      },
      {
        metric: "Stock stress",
        value: Math.max(0, 100 - Math.round((form.stock_at_distributor / 200) * 100)),
      },
    ],
    [form]
  );

  async function runPrediction() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ml/priority", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await response.json()) as PriorityPredictionResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Prediction failed.");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prediction.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Priority Prediction Workbench</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Days Since Last Booking</span>
            <Input
              type="number"
              min={0}
              value={form.days_since_last_booking}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  days_since_last_booking: toInt(e.target.value, prev.days_since_last_booking),
                }))
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">BPL Household</span>
            <Select
              value={String(form.is_bpl)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_bpl: Number(e.target.value) === 1 ? 1 : 0,
                }))
              }
            >
              <option value="1">Yes</option>
              <option value="0">No</option>
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Urgency</span>
            <Select
              value={form.urgency}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  urgency: e.target.value as PriorityPredictionRequest["urgency"],
                }))
              }
            >
              <option value="medical">Medical</option>
              <option value="bpl">BPL Need</option>
              <option value="regular">Regular</option>
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Crisis Level</span>
            <Select
              value={form.crisis_level}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  crisis_level: e.target.value as PriorityPredictionRequest["crisis_level"],
                }))
              }
            >
              <option value="normal">Normal</option>
              <option value="alert">Alert</option>
              <option value="emergency">Emergency</option>
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Stock At Distributor</span>
            <Input
              type="number"
              min={0}
              value={form.stock_at_distributor}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  stock_at_distributor: toInt(e.target.value, prev.stock_at_distributor),
                }))
              }
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-300">Queue Position</span>
            <Input
              type="number"
              min={1}
              value={form.queue_position}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  queue_position: Math.max(1, toInt(e.target.value, prev.queue_position)),
                }))
              }
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={runPrediction} disabled={loading}>
            {loading ? "Running model..." : "Run Prediction"}
          </Button>
          {result && (
            <Badge variant={result.priority_band === "high" ? "danger" : result.priority_band === "medium" ? "warning" : "success"}>
              {result.priority_band.toUpperCase()} PRIORITY
            </Badge>
          )}
          {result?.source && (
            <span className="text-xs text-slate-400">Source: {result.source}</span>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        {result && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Predicted Priority Score</p>
              <p className={`mt-1 text-3xl font-bold ${BAND_COLORS[result.priority_band]}`}>
                {result.predicted_priority_score.toFixed(2)}
              </p>
              <div className="mt-3">
                <Progress value={result.predicted_priority_score} />
              </div>
              {result.note && <p className="mt-2 text-xs text-amber-300">{result.note}</p>}
            </div>

            <div className="h-56 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioData}>
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
        )}
      </CardContent>
    </Card>
  );
}
