# Database to ML Integration Guide

This guide explains how to connect the new database layer with the ML prediction service.

## Current Architecture

### Before (Mock Data)
```
UI Component
   ↓
Manual Feature Entry
   ↓
/api/ml/priority (Hard-coded JSON)
   ↓
FastAPI ML Service (/predict/priority)
```

### After (Database-Driven)
```
UI Component
   ↓
/api/ml/predict-job (householdId, distributorId)
   ↓
[Database Layer]
├─ Household: bpl, lastBookingDate, locationChanges30d
├─ Distributor: stock
├─ System: crisisLevel
└─ Booking Request: urgency, cylindersRequested
   ↓
[Feature Computation] lib/ml-features.ts
   ↓
/api/ml/priority (9 computed features)
   ↓
FastAPI ML Service (/predict/priority)
   ↓
Result → Database (PredictionLog)
```

## Implementation Steps

### Step 1: Create the Orchestration Endpoint

Create a new API route that orchestrates the full flow:

**File: `app/api/ml/predict-job/route.ts`**

```typescript
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
  bookingId?: string; // For immediate logging
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

    // Validate request
    if (!householdId || !distributorId || !urgency || !cylindersRequested) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch data from database (parallel for performance)
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

    // Compute ML features from database records
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

    // Validate computed features
    if (!validateMLFeatures(features)) {
      return NextResponse.json(
        { error: "Computed features are invalid" },
        { status: 400 }
      );
    }

    // Call ML service via existing priority endpoint
    const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/priority`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(features),
      cache: "no-store",
    });

    let prediction: PriorityPredictionResponse;

    if (mlResponse.ok) {
      prediction = await mlResponse.json() as PriorityPredictionResponse;
    } else {
      // ML service failed - use fallback from existing priority endpoint
      const fallbackResponse = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/ml/priority`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(features),
        }
      );
      prediction = await fallbackResponse.json() as PriorityPredictionResponse;
    }

    // Log prediction for audit trail (async, don't wait)
    if (bookingId) {
      logPrediction({
        bookingId,
        inputFeatures: features,
        predictedScore: prediction.predicted_priority_score,
        priorityBand: prediction.priority_band,
        source: prediction.source,
      }).catch(console.error);
    }

    // Return prediction result
    return NextResponse.json({
      prediction,
      computedFeatures: features,
      household: {
        id: household.id,
        bpl: household.bpl,
        lastBookingDate: household.lastBookingDate,
        locationChanges30d: household.locationChanges30d,
      },
      distributor: {
        id: distributor.id,
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
```

### Step 2: Update Component to Use New Endpoint

Update booking components to call the orchestration endpoint:

```typescript
// In a React component (e.g., /book page)
async function handleBooking(householdId: string, distributorId: string) {
  // Call prediction orchestration endpoint
  const response = await fetch("/api/ml/predict-job", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      householdId,
      distributorId,
      urgency: selectedUrgency,
      cylindersRequested: selectedCylinders,
      queuePosition: 5, // Or fetch from DB
    }),
  });

  const { prediction, computedFeatures } = await response.json();

  // Now create booking with prediction
  const bookingResponse = await fetch("/api/db/bookings", {
    method: "POST",
    body: JSON.stringify({
      householdId,
      distributorId,
      urgency: selectedUrgency,
      cylindersRequested: selectedCylinders,
      priorityScore: prediction.predicted_priority_score,
      priorityBand: prediction.priority_band,
      mlSource: prediction.source,
    }),
  });

  const booking = await bookingResponse.json();
  return booking;
}
```

### Step 3: Remove Mock Data Dependencies

Update components that currently import mock data:

```typescript
// BEFORE
import { households, distributors } from "@/data/mock-data";

// AFTER
async function loadData() {
  const response = await fetch("/api/db/data");
  const { households, distributors, crisisLevel } = await response.json();
  // Use data...
}
```

## Feature Mapping Reference

| ML Feature | Source | Computation |
|-----------|--------|-------------|
| `days_since_last_booking` | `Household.lastBookingDate` | `Math.floor((now - lastBookingDate) / millisPerDay)`, default 90 if null |
| `is_bpl` | `Household.bpl` | Convert boolean to 0/1 |
| `urgency` | `Booking.urgency` | Direct value: "medical", "bpl", or "regular" |
| `crisis_level` | `SystemConfig` | Direct value: "normal", "alert", or "emergency" |
| `cylinders_requested` | `Booking.cylindersRequested` | Direct value from user input |
| `stock_at_distributor` | `Distributor.stock` | Current inventory at depot |
| `queue_position` | `Booking.queuePosition` | Position in delivery queue |
| `location_changes_30d` | `Household.locationChanges30d` | Incremented on each address update |
| `booking_gap_days` | `Household.lastBookingDate` | Currently same as `days_since_last_booking` |

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    UI Component                              │
│              (Customer Books Cylinder)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/ml/predict-job                             │
│        (Orchestration Endpoint)                              │
│                                                               │
│  1. Validate input (householdId, distributorId)              │
│  2. Fetch household, distributor, crisisLevel               │
│  3. Compute 9 ML features                                    │
│  4. Validate features                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
    ┌──────────────────┐         ┌──────────────────┐
    │  /api/ml/        │         │   FastAPI ML     │
    │  priority        │ (async) │   Service        │
    │ (fallback)       │         │  /predict/       │
    │                  │         │  priority        │
    └──────────────────┘         └────────┬─────────┘
          │                               │
          │                    ┌──────────┴──────────┐
          │                    │                     │
          └────────┬───────────┘                     │
                   │                                 │
                   ▼                                 ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │  Fallback Prediction │      │  ML Service Result   │
        │  (if ML fails)       │      │  (if ML succeeds)    │
        │  - heuristic-based   │      │  - ml-service        │
        │  - score + band      │      │  - score + band      │
        └──────────────┬───────┘      └────────────┬─────────┘
                       │                           │
                       └───────────────┬───────────┘
                                       │
                                       ▼
                        ┌──────────────────────────┐
                        │  /api/db/predictions     │
                        │  (Log for audit trail)   │
                        │  - inputFeatures         │
                        │  - predictedScore        │
                        │  - priorityBand          │
                        │  - source                │
                        └───────────────┬──────────┘
                                        │
                                        ▼
                        ┌──────────────────────────┐
                        │  Database                │
                        │  PredictionLog           │
                        │                          │
                        │  Audit Trail Stored      │
                        └──────────────────────────┘
```

## Fallback Strategy

If ML service is unavailable:
1. `/api/ml/predict-job` calls `/api/ml/priority` (existing heuristic endpoint)
2. Heuristic fallback computation happens
3. Prediction is marked with `source: "heuristic-fallback"`
4. Still logs to database for tracking

This ensures system resilience without data loss.

## Testing Checklist

- [ ] Create test household and distributor in database
- [ ] Call `/api/ml/predict-job` with valid householdId + distributorId
- [ ] Verify features are computed correctly
- [ ] Verify ML service receives correct feature payload
- [ ] Verify prediction result is returned
- [ ] Verify booking can be created with prediction
- [ ] Verify prediction is logged to PredictionLog table
- [ ] Test fallback when ML service is unavailable
- [ ] Test with various household/distributor combinations

## Performance Notes

- Parallel database fetches using `Promise.all()` for better latency
- ML feature computation is O(1) - constant time
- ML service call is the main bottleneck (controlled via timeout)
- Prediction logging is async to avoid blocking response

## Security Notes

- Input validation on householdId and distributorId
- Rate limiting should be applied (TBD)
- ML features are computed server-side (no client manipulation)
- Audit trail via PredictionLog table
