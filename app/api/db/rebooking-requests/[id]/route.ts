import { NextResponse } from "next/server";
import { reviewRebookingRequest } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { decision, reviewNote } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 }
      );
    }

    if (decision !== "approved" && decision !== "rejected") {
      return NextResponse.json(
        { error: "decision must be approved or rejected" },
        { status: 400 }
      );
    }

    const result = await reviewRebookingRequest({
      requestId: id,
      decision,
      reviewNote,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.reason === "not_found"
              ? "Request not found"
              : "Request already reviewed",
        },
        { status: result.reason === "not_found" ? 404 : 409 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to review rebooking request:", error);
    return NextResponse.json(
      { error: "Failed to review rebooking request" },
      { status: 500 }
    );
  }
}
