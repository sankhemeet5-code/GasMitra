import { NextResponse } from "next/server";
import { getCrisisLevel, setCrisisLevel } from "@/lib/db";

export async function GET() {
  try {
    const crisisLevel = await getCrisisLevel();
    return NextResponse.json({ crisisLevel });
  } catch (error) {
    console.error("Failed to fetch crisis level:", error);
    return NextResponse.json(
      { error: "Failed to fetch crisis level" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { level } = body;

    if (!level || !["normal", "alert", "emergency"].includes(level)) {
      return NextResponse.json(
        { error: 'Level must be one of: "normal", "alert", "emergency"' },
        { status: 400 }
      );
    }

    const updated = await setCrisisLevel(level);
    return NextResponse.json({ crisisLevel: updated });
  } catch (error) {
    console.error("Failed to update crisis level:", error);
    return NextResponse.json(
      { error: "Failed to update crisis level" },
      { status: 500 }
    );
  }
}
