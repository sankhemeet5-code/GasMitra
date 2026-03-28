import { NextResponse } from "next/server";
import {
  getBookingsByDistributorId,
  updateDistributorStock,
  getPendingBookings,
} from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "pending") {
      // Get all pending bookings system-wide
      const bookings = await getPendingBookings();
      return NextResponse.json(bookings);
    }

    if (!id) {
      return NextResponse.json(
        { error: "Distributor ID is required" },
        { status: 400 }
      );
    }

    // Get bookings for specific distributor
    const bookings = await getBookingsByDistributorId(id);
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Failed to fetch distributor bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch distributor bookings" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { stock } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Distributor ID is required" },
        { status: 400 }
      );
    }

    if (stock === undefined) {
      return NextResponse.json(
        { error: "Stock quantity is required" },
        { status: 400 }
      );
    }

    await updateDistributorStock(id, stock);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update distributor stock:", error);
    return NextResponse.json(
      { error: "Failed to update distributor stock" },
      { status: 500 }
    );
  }
}
