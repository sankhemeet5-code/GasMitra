import { NextResponse } from "next/server";
import {
  createBooking,
  getBookings,
  getBookingLockStatus,
  getBookingsByHouseholdId,
  getPendingBookings,
} from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const householdId = searchParams.get("householdId");

    if (action === "pending") {
      const bookings = await getPendingBookings();
      return NextResponse.json(bookings);
    }

    if (action === "all") {
      const bookings = await getBookings();
      return NextResponse.json(bookings);
    }

    if (action === "lock-status") {
      if (!householdId) {
        return NextResponse.json(
          { error: "householdId is required for lock-status" },
          { status: 400 }
        );
      }

      const status = await getBookingLockStatus(householdId);
      return NextResponse.json(status);
    }

    if (!householdId) {
      return NextResponse.json(
        { error: "householdId is required unless action is provided" },
        { status: 400 }
      );
    }

    const bookings = await getBookingsByHouseholdId(householdId);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      householdId,
      distributorId,
      urgency,
      cylindersRequested,
      priorityScore,
      priorityBand,
      mlSource,
    } = body;

    const normalizedPriorityBand =
      priorityBand === "high" || priorityBand === "medium" || priorityBand === "low"
        ? priorityBand
        : "medium";
    const normalizedMlSource =
      mlSource === "heuristic-fallback" ? "heuristic-fallback" : "ml-service";

    if (!householdId || !distributorId || !urgency || !cylindersRequested) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const lockStatus = await getBookingLockStatus(householdId);
    if (lockStatus.isLocked) {
      return NextResponse.json(
        {
          error: "Booking locked due to 30-day lock-in period",
          code: "LOCK_IN_ACTIVE",
          ...lockStatus,
        },
        { status: 409 }
      );
    }

    const booking = await createBooking({
      householdId,
      distributorId,
      urgency,
      cylindersRequested,
      priorityScore,
      priorityBand: normalizedPriorityBand,
      mlSource: normalizedMlSource,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Failed to create booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
