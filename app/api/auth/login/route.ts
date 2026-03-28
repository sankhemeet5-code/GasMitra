import { NextResponse } from "next/server";
import { authenticateRoleLogin } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, loginId, password } = body as {
      role?: "distributor" | "admin";
      loginId?: string;
      password?: string;
    };

    if (!role || !loginId || !password) {
      return NextResponse.json(
        { error: "role, loginId and password are required" },
        { status: 400 }
      );
    }

    if (role !== "distributor" && role !== "admin") {
      return NextResponse.json(
        { error: "role must be distributor or admin" },
        { status: 400 }
      );
    }

    const result = await authenticateRoleLogin({ role, loginId, password });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, userId: result.userId });
  } catch (error) {
    console.error("Auth login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
