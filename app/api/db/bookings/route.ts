import { NextResponse } from "next/server";
import {
  createBooking,
  getBookings,
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

    if (!householdId || !distributorId || !urgency || !cylindersRequested) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const booking = await createBooking({
      householdId,
      distributorId,
      urgency,
      cylindersRequested,
      priorityScore,
      priorityBand,
      mlSource,
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
