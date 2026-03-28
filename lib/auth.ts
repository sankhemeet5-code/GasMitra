import { UserRole } from "@/types";

// Where each role lands after login
export const ROLE_HOME: Record<UserRole, string> = {
  customer:    "/dashboard",
  distributor: "/distributor",
  admin:       "/admin",
};

export interface NavLink {
  href:  string;
  label: string;
  icon:  string;
}

// Sidebar links per role
export const ROLE_LINKS: Record<UserRole, NavLink[]> = {
  customer: [
    { href: "/dashboard", label: "Dashboard",    icon: "LayoutDashboard" },
    { href: "/book",      label: "Book Cylinder", icon: "Flame" },
    { href: "/bookings",  label: "My Bookings",   icon: "ClipboardList" },
  ],
  distributor: [
    { href: "/distributor", label: "Distributor Panel", icon: "Truck" },
  ],
  admin: [
    { href: "/admin",       label: "Admin Panel", icon: "ShieldCheck" },
    { href: "/ai-insights", label: "AI Insights", icon: "Brain" },
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  customer:    "Customer",
  distributor: "Distributor",
  admin:       "Admin",
};

// Tailwind classes for the role badge in the sidebar
export const ROLE_COLORS: Record<UserRole, string> = {
  customer:    "text-teal-300   bg-teal-400/10   border-teal-400/20",
  distributor: "text-blue-300   bg-blue-400/10   border-blue-400/20",
  admin:       "text-purple-300 bg-purple-400/10 border-purple-400/20",
};

// Which roles may access each protected route
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["customer"],
  "/book":      ["customer"],
  "/bookings":  ["customer"],
  "/distributor": ["distributor"],
  "/admin":       ["admin"],
  "/ai-insights": ["admin"],
};
