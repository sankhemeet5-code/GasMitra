import { NextResponse } from "next/server";
import { logPrediction } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, inputFeatures, predictedScore, priorityBand, source } =
      body;

    if (
      !bookingId ||
      !inputFeatures ||
      predictedScore === undefined ||
      !priorityBand ||
      !source
    ) {
      return NextResponse.json(
        { error: "Missing required fields for prediction logging" },
        { status: 400 }
      );
    }

    const prediction = await logPrediction({
      bookingId,
      inputFeatures,
      predictedScore,
      priorityBand,
      source,
    });

    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    console.error("Failed to log prediction:", error);
    return NextResponse.json(
      { error: "Failed to log prediction" },
      { status: 500 }
    );
  }
}
