import { NextResponse } from "next/server";
import { updateBookingStatus, updateBookingPriority } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, priorityScore, priorityBand, mlSource } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Update status if provided
    if (status) {
      await updateBookingStatus(id, status);
    }

    // Update priority if provided
    if (priorityScore !== undefined || priorityBand || mlSource) {
      await updateBookingPriority(
        id,
        priorityScore,
        priorityBand,
        mlSource
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
