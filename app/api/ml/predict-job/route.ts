import { NextResponse } from "next/server";
import {
  getHouseholdById,
  getDistributorById,
  getCrisisLevel,
  logPrediction,
} from "@/lib/db";
import { computeMLFeatures, validateMLFeatures } from "@/lib/ml-features";
import { PriorityPredictionResponse } from "@/types";

interface PredictJobRequest {
  householdId: string;
  distributorId: string;
  urgency: "medical" | "bpl" | "regular";
  cylindersRequested: number;
  queuePosition: number;
  bookingId?: string;
}

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PredictJobRequest;
    const {
      householdId,
      distributorId,
      urgency,
      cylindersRequested,
      queuePosition,
      bookingId,
    } = body;

    if (!householdId || !distributorId || !urgency || !cylindersRequested) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [household, distributor, crisisLevel] = await Promise.all([
      getHouseholdById(householdId),
      getDistributorById(distributorId),
      getCrisisLevel(),
    ]);

    if (!household || !distributor) {
      return NextResponse.json(
        { error: "Household or distributor not found" },
        { status: 404 }
      );
    }

    const features = computeMLFeatures({
      household,
      distributor,
      booking: {
        urgency,
        cylindersRequested,
        queuePosition,
      },
      crisisLevel,
    });

    if (!validateMLFeatures(features)) {
      return NextResponse.json(
        { error: "Computed features are invalid" },
        { status: 400 }
      );
    }

    let prediction: PriorityPredictionResponse;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/priority`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!mlResponse.ok) {
        throw new Error(`ML service error: ${mlResponse.status}`);
      }

      prediction = (await mlResponse.json()) as PriorityPredictionResponse;
    } catch (mlError) {
      // Fallback to heuristic if ML fails
      console.warn("ML service failed, using heuristic fallback:", mlError);

      // Use existing heuristic endpoint
      const fallbackResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/ml/priority`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(features),
        }
      );

      if (!fallbackResponse.ok) {
        return NextResponse.json(
          { error: "Both ML service and fallback failed" },
          { status: 500 }
        );
      }

      prediction =
        (await fallbackResponse.json()) as PriorityPredictionResponse;
    }

    // Log prediction for audit trail (async, don't wait)
    if (bookingId) {
      logPrediction({
        bookingId,
        inputFeatures: features as unknown as Record<string, unknown>,
        predictedScore: prediction.predicted_priority_score,
        priorityBand: prediction.priority_band,
        source: prediction.source,
      }).catch(console.error);
    }

    return NextResponse.json({
      prediction,
      computedFeatures: features,
      household: {
        id: household.id,
        name: household.name,
        bpl: household.bpl,
        lastBookingDate: household.lastBookingDate,
        locationChanges30d: household.locationChanges30d,
      },
      distributor: {
        id: distributor.id,
        name: distributor.name,
        stock: distributor.stock,
      },
      crisisLevel,
    });
  } catch (error) {
    console.error("Prediction job failed:", error);
    return NextResponse.json(
      { error: "Prediction job failed" },
      { status: 500 }
    );
  }
}
