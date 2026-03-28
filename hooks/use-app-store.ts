"use client";

import { create } from "zustand";
import { Booking, CrisisLevel, UserRole } from "@/types";
import { bookings as initialBookings, households } from "@/data/mock-data";

interface AppState {
  role: UserRole;
  crisisLevel: CrisisLevel;
  currentUserId: string;
  bookings: Booking[];
  stockOverride: Record<string, number>;
  setRole: (role: UserRole) => void;
  setCrisisLevel: (level: CrisisLevel) => void;
  addBooking: (booking: Booking) => void;
  markDelivered: (bookingId: string) => void;
  updateStock: (distributorId: string, stock: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: "user",
  crisisLevel: "alert",
  currentUserId: households[0].id,
  bookings: initialBookings,
  stockOverride: {},
  setRole: (role) => set({ role }),
  setCrisisLevel: (crisisLevel) => set({ crisisLevel }),
  addBooking: (booking) =>
    set((state) => ({
      bookings: [booking, ...state.bookings],
    })),
  markDelivered: (bookingId) =>
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, status: "delivered" } : booking
      ),
    })),
  updateStock: (distributorId, stock) =>
    set((state) => ({
      stockOverride: { ...state.stockOverride, [distributorId]: stock },
    })),
}));
