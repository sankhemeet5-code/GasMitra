import { NextResponse } from "next/server";
import { getCustomerByPhone, logLoginEvent } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body?.phone ?? "").replace(/\D/g, "");

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }

    const customer = await getCustomerByPhone(phone);

    if (!customer) {
      await logLoginEvent({
        role: "customer",
        loginId: phone,
        method: "otp",
        success: false,
        message: "otp_request_unknown_phone",
      });
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await logLoginEvent({
      userId: customer.userId,
      role: "customer",
      loginId: phone,
      method: "otp",
      success: true,
      message: "otp_requested",
    });

    return NextResponse.json({ ok: true, otpHint: "For demo: any 6 digits" });
  } catch (error) {
    console.error("OTP request failed:", error);
    return NextResponse.json({ error: "OTP request failed" }, { status: 500 });
  }
}
