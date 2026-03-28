import { NextRequest, NextResponse } from "next/server";

// Inline types to avoid potential Edge-runtime import issues
type UserRole = "customer" | "distributor" | "admin";

const ROLE_HOME: Record<UserRole, string> = {
  customer:    "/dashboard",
  distributor: "/distributor",
  admin:       "/admin",
};

// Which roles may access each route
const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["customer"],
  "/book":      ["customer"],
  "/bookings":  ["customer"],
  "/distributor": ["distributor"],
  "/admin":       ["admin"],
  "/ai-insights": ["admin"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawRole = request.cookies.get("gasmitra_role")?.value;
  const role = rawRole as UserRole | undefined;

  // Auth pages are always public — never protect them
  if (pathname.startsWith("/auth")) return NextResponse.next();

  const allowedRoles = ROUTE_ROLES[pathname];

  // Route is not protected — let through
  if (!allowedRoles) return NextResponse.next();

  // Not logged in (no valid cookie) → login page
  if (!role || !ROLE_HOME[role]) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Logged in with wrong role → redirect to their home
  if (!allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/book",
    "/bookings",
    "/distributor",
    "/admin",
    "/ai-insights",
    "/auth/:path*",
  ],
};
