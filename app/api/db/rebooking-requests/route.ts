import { NextResponse } from "next/server";
import {
  createRebookingRequest,
  getLockPeriodRequestAllowance,
  getRebookingRequests,
} from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const householdId = searchParams.get("householdId");

    const validStatus =
      status === "pending" || status === "approved" || status === "rejected"
        ? status
        : undefined;

    const requests = await getRebookingRequests({
      status: validStatus,
      householdId: householdId ?? undefined,
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch rebooking requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch rebooking requests" },
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
      reviewNote,
    } = body;

    if (!householdId || !distributorId || !urgency || !cylindersRequested) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const allowance = await getLockPeriodRequestAllowance(householdId);

    if (!allowance.isLocked) {
      return NextResponse.json(
        {
          error: "Lock-period requests are only allowed during active lock period",
          code: "LOCK_IN_NOT_ACTIVE",
          ...allowance,
        },
        { status: 409 }
      );
    }

    if (allowance.remainingRequests <= 0) {
      return NextResponse.json(
        {
          error: `Only ${allowance.maxRequests} requests are allowed during lock period`,
          code: "REQUEST_LIMIT_REACHED",
          ...allowance,
        },
        { status: 409 }
      );
    }

    const normalizedPriorityBand =
      priorityBand === "high" || priorityBand === "medium" || priorityBand === "low"
        ? priorityBand
        : "medium";
    const normalizedMlSource =
      mlSource === "heuristic-fallback" ? "heuristic-fallback" : "ml-service";

    const created = await createRebookingRequest({
      householdId,
      distributorId,
      urgency,
      cylindersRequested,
      priorityScore: Number(priorityScore ?? 50),
      priorityBand: normalizedPriorityBand,
      mlSource: normalizedMlSource,
      reviewNote,
    });

    return NextResponse.json(
      {
        request: created,
        allowance: {
          ...allowance,
          usedRequests: allowance.usedRequests + 1,
          remainingRequests: Math.max(0, allowance.remainingRequests - 1),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create rebooking request:", error);
    return NextResponse.json(
      { error: "Failed to create rebooking request" },
      { status: 500 }
    );
  }
}
