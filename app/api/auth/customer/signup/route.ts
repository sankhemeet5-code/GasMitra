import { NextResponse } from "next/server";
import { registerCustomer } from "@/lib/db";
import type { CustomerProfile } from "@/types";

export async function POST(request: Request) {
  try {
    const profile = (await request.json()) as CustomerProfile;

    if (!profile?.name || !profile?.phone || !profile?.pincode || !profile?.aadhaarLast4) {
      return NextResponse.json(
        { error: "Missing required signup fields" },
        { status: 400 }
      );
    }

    const result = await registerCustomer(profile);

    if (!result.ok) {
      return NextResponse.json(
        { error: "Phone is already registered" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      userId: result.userId,
      household: result.household,
    });
  } catch (error) {
    console.error("Customer signup failed:", error);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
