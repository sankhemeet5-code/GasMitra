"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Booking, CrisisLevel, CustomerProfile, UserRole } from "@/types";
import { bookings as initialBookings, households } from "@/data/mock-data";

function setCookie(name: string, value: string, maxAge = 86400) {
  if (typeof document !== "undefined") {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }
}

interface AppState {
  role: UserRole;
  crisisLevel: CrisisLevel;
  currentUserId: string;
  bookings: Booking[];
  stockOverride: Record<string, number>;
  customerProfile: CustomerProfile | null;
  setRole: (role: UserRole) => void;
  setCrisisLevel: (level: CrisisLevel) => void;
  addBooking: (booking: Booking) => void;
  markDelivered: (bookingId: string) => void;
  updateStock: (distributorId: string, stock: number) => void;
  setCustomerProfile: (profile: CustomerProfile) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      role: "customer",
      crisisLevel: "alert",
      currentUserId: households[0].id,
      bookings: initialBookings,
      stockOverride: {},
      customerProfile: null,

      setRole: (role) => {
        setCookie("gasmitra_role", role);
        set({ role });
      },

      setCrisisLevel: (crisisLevel) => set({ crisisLevel }),

      addBooking: (booking) =>
        set((state) => ({ bookings: [booking, ...state.bookings] })),

      markDelivered: (bookingId) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, status: "delivered" } : b
          ),
        })),

      updateStock: (distributorId, stock) =>
        set((state) => ({
          stockOverride: { ...state.stockOverride, [distributorId]: stock },
        })),

      setCustomerProfile: (profile) => set({ customerProfile: profile }),

      logout: () => {
        setCookie("gasmitra_role", "", 0);
        set({ role: "customer", customerProfile: null });
      },
    }),
    {
      name: "gasmitra-storage",
      partialize: (state) => ({
        role: state.role,
        customerProfile: state.customerProfile,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.role) {
          setCookie("gasmitra_role", state.role);
        }
      },
    }
  )
);
