import { NextResponse } from "next/server";
import {
  getHouseholds,
  getDistributors,
  getCrisisLevel,
} from "@/lib/db";

export async function GET() {
  try {
    const [households, distributors, crisisLevel] = await Promise.all([
      getHouseholds(),
      getDistributors(),
      getCrisisLevel(),
    ]);

    return NextResponse.json({
      households,
      distributors,
      crisisLevel,
    });
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
