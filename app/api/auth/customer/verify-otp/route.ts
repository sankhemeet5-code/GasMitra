import { NextResponse } from "next/server";
import { verifyCustomerOtpLogin } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body?.phone ?? "");
    const otp = String(body?.otp ?? "");

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "phone and otp are required" },
        { status: 400 }
      );
    }

    const result = await verifyCustomerOtpLogin(phone, otp);

    if (!result.ok) {
      return NextResponse.json(
        { error: "Invalid OTP or phone" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      userId: result.userId,
      household: result.household,
    });
  } catch (error) {
    console.error("OTP verification failed:", error);
    return NextResponse.json({ error: "OTP verification failed" }, { status: 500 });
  }
}
