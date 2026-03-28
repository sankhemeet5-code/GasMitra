import { NextResponse } from "next/server";
import { PriorityPredictionRequest, PriorityPredictionResponse } from "@/types";

export const runtime = "nodejs";

const URGENCY_WEIGHTS = {
  medical: 35,
  bpl: 24,
  regular: 12,
} as const;

const CRISIS_BONUS = {
  normal: 0,
  alert: 6,
  emergency: 12,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getBand(score: number): PriorityPredictionResponse["priority_band"] {
  if (score > 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function toFallbackPrediction(payload: PriorityPredictionRequest): PriorityPredictionResponse {
  const dayFactor = clamp(Math.floor(payload.days_since_last_booking * 1.5), 0, 40);
  const bplFactor = payload.is_bpl ? 25 : 5;
  const urgencyFactor = URGENCY_WEIGHTS[payload.urgency];
  const crisisFactor = CRISIS_BONUS[payload.crisis_level];

  // Penalize rapidly changing addresses and long queues, reward healthier stock.
  const queuePenalty = clamp(Math.round(payload.queue_position / 50), 0, 14);
  const locationPenalty = clamp(payload.location_changes_30d * 2, 0, 10);
  const stockRelief = clamp(Math.round(payload.stock_at_distributor / 80), 0, 12);

  const rawScore = dayFactor + bplFactor + urgencyFactor + crisisFactor - queuePenalty - locationPenalty + stockRelief;
  const predicted = clamp(Math.round(rawScore * 100) / 100, 0, 100);

  return {
    predicted_priority_score: predicted,
    priority_band: getBand(predicted),
    source: "heuristic-fallback",
    note: "ML service unavailable. Showing a local estimate.",
  };
}

function isValidPayload(payload: unknown): payload is PriorityPredictionRequest {
  if (!payload || typeof payload !== "object") return false;

  const p = payload as Record<string, unknown>;

  return (
    typeof p.days_since_last_booking === "number" &&
    typeof p.is_bpl === "number" &&
    (p.is_bpl === 0 || p.is_bpl === 1) &&
    typeof p.urgency === "string" &&
    ["medical", "bpl", "regular"].includes(p.urgency) &&
    typeof p.crisis_level === "string" &&
    ["normal", "alert", "emergency"].includes(p.crisis_level) &&
    typeof p.cylinders_requested === "number" &&
    typeof p.stock_at_distributor === "number" &&
    typeof p.queue_position === "number" &&
    typeof p.location_changes_30d === "number" &&
    typeof p.booking_gap_days === "number"
  );
}

export async function POST(request: Request) {
  let payload: PriorityPredictionRequest;

  try {
    const raw = await request.json();
    if (!isValidPayload(raw)) {
      return NextResponse.json(
        { error: "Invalid prediction payload." },
        { status: 400 }
      );
    }
    payload = raw;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const mlBaseUrl = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const upstream = await fetch(`${mlBaseUrl}/predict/priority`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!upstream.ok) {
      throw new Error(`Upstream ML service responded ${upstream.status}`);
    }

    const data = (await upstream.json()) as {
      predicted_priority_score?: number;
      priority_band?: "low" | "medium" | "high";
    };

    const predicted = clamp(Number(data.predicted_priority_score ?? 0), 0, 100);

    return NextResponse.json({
      predicted_priority_score: Math.round(predicted * 100) / 100,
      priority_band: data.priority_band ?? getBand(predicted),
      source: "ml-service",
    } as PriorityPredictionResponse);
  } catch {
    return NextResponse.json(toFallbackPrediction(payload));
  }
}
