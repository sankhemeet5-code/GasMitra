/**
 * ML Feature Computation Utility
 * 
 * This utility takes database records (Household and Distributor) and computes
 * the 9 ML features required by the priority prediction model.
 * 
 * ML Model Contract (9 features):
 * - days_since_last_booking: Days since customer last booked (0-365)
 * - is_bpl: Boolean flag (0 or 1) - Below Poverty Line status
 * - urgency: Categorical - "medical", "bpl", or "regular"
 * - crisis_level: System state - "normal", "alert", or "emergency"
 * - cylinders_requested: Integer - How many cylinders in this booking
 * - stock_at_distributor: Integer - Current stock level at distributor
 * - queue_position: Integer - Position in distributor's delivery queue
 * - location_changes_30d: Integer - Address changes in last 30 days
 * - booking_gap_days: Integer - Max days between any two bookings historically
 */

import { PriorityPredictionRequest } from "@/types";

export interface ComputeMLFeaturesInput {
  // Household data (customer profile)
  household: {
    bpl: boolean;
    lastBookingDate: Date | string | null;
    locationChanges30d: number;
  };
  // Distributor data
  distributor: {
    stock: number;
  };
  // Booking request data
  booking: {
    urgency: "medical" | "bpl" | "regular";
    cylindersRequested: number;
    queuePosition: number;
  };
  // System state
  crisisLevel: "normal" | "alert" | "emergency";
}

/**
 * Compute all 9 ML features from database records
 * 
 * @param input - Household, distributor, booking and system data
 * @returns ML feature payload ready for ML service
 */
export function computeMLFeatures(
  input: ComputeMLFeaturesInput
): PriorityPredictionRequest {
  // 1. DAYS_SINCE_LAST_BOOKING
  // If no previous booking, assume very old (90 days)
  const daysSinceLastBooking = input.household.lastBookingDate
    ? Math.floor(
        (Date.now() - new Date(input.household.lastBookingDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 90;

  // 2. IS_BPL
  // Convert boolean to 0/1 for ML model
  const isBpl: 0 | 1 = input.household.bpl ? 1 : 0;

  // 3-5. Directly from request/system
  const urgency = input.booking.urgency;
  const crisisLevel = input.crisisLevel;
  const cylindersRequested = input.booking.cylindersRequested;

  // 6. STOCK_AT_DISTRIBUTOR
  // Current inventory level at distributor depot
  const stockAtDistributor = input.distributor.stock;

  // 7. QUEUE_POSITION
  // Where this booking would be in the delivery queue
  const queuePosition = input.booking.queuePosition;

  // 8. LOCATION_CHANGES_30D
  // How many times customer changed address in last 30 days
  const locationChanges30d = input.household.locationChanges30d;

  // 9. BOOKING_GAP_DAYS
  // For now: use same as days_since_last_booking as proxy
  // In future: could track max gap between all historical bookings
  const bookingGapDays = daysSinceLastBooking;

  return {
    days_since_last_booking: daysSinceLastBooking,
    is_bpl: isBpl,
    urgency,
    crisis_level: crisisLevel,
    cylinders_requested: cylindersRequested,
    stock_at_distributor: stockAtDistributor,
    queue_position: queuePosition,
    location_changes_30d: locationChanges30d,
    booking_gap_days: bookingGapDays,
  };
}

/**
 * Helper to validate computed features
 * @param features - Computed ML features
 * @returns true if all features are valid
 */
export function validateMLFeatures(
  features: PriorityPredictionRequest
): boolean {
  return (
    typeof features.days_since_last_booking === "number" &&
    features.days_since_last_booking >= 0 &&
    features.days_since_last_booking <= 365 &&
    (features.is_bpl === 0 || features.is_bpl === 1) &&
    ["medical", "bpl", "regular"].includes(features.urgency) &&
    ["normal", "alert", "emergency"].includes(features.crisis_level) &&
    typeof features.cylinders_requested === "number" &&
    features.cylinders_requested > 0 &&
    typeof features.stock_at_distributor === "number" &&
    features.stock_at_distributor >= 0 &&
    typeof features.queue_position === "number" &&
    features.queue_position >= 0 &&
    typeof features.location_changes_30d === "number" &&
    features.location_changes_30d >= 0 &&
    typeof features.booking_gap_days === "number" &&
    features.booking_gap_days >= 0
  );
}

/**
 * Example usage in an API route:
 * 
 * ```typescript
 * import { computeMLFeatures, validateMLFeatures } from "@/lib/ml-features";
 * import { getHouseholdByUserId, getDistributorById, getCrisisLevel } from "@/lib/db";
 * 
 * export async function POST(request: Request) {
 *   const { householdId, distributorId, urgency, cylindersRequested } = await request.json();
 *   
 *   const household = await getHouseholdByUserId(householdId);
 *   const distributor = await getDistributorById(distributorId);
 *   const crisisLevel = await getCrisisLevel();
 *   
 *   const features = computeMLFeatures({
 *     household,
 *     distributor,
 *     booking: {
 *       urgency,
 *       cylindersRequested,
 *       queuePosition: 5 // Or fetch from DB
 *     },
 *     crisisLevel
 *   });
 *   
 *   if (!validateMLFeatures(features)) {
 *     return NextResponse.json({ error: "Invalid features" }, { status: 400 });
 *   }
 *   
 *   // Call ML service with features
 *   const mlResponse = await fetch(`${ML_SERVICE_URL}/predict/priority`, {
 *     method: "POST",
 *     body: JSON.stringify(features)
 *   });
 *   
 *   return NextResponse.json(mlResponse.json());
 * }
 * ```
 */
