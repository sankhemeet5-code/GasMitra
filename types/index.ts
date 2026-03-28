export type CrisisLevel = "normal" | "alert" | "emergency";
export type UrgencyType = "medical" | "bpl" | "regular";
export type BookingStatus = "pending" | "delivered";
export type UserRole = "customer" | "distributor" | "admin";

export interface CustomerProfile {
  name: string;            // Full name as per Aadhaar
  phone: string;           // 10-digit Indian phone number
  pincode: string;         // 6-digit pincode
  familySize: number;      // Number of family members
  rationNumber: string;    // Ration card number
  aadhaarLast4: string;    // Last 4 digits of Aadhaar
  businessLicense?: string; // Optional — commercial gas cylinder
}

export interface Household {
  id: string;
  name: string;
  address: string;
  pincode: string;
  aadhaarMasked: string;
  bpl: boolean;
  phoneMasked: string;
  lastBookingDate: string;
}

export interface Distributor {
  id: string;
  name: string;
  pincode: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  stock: number;
}

export interface Booking {
  id: string;
  householdId: string;
  distributorId: string;
  requestDate: string;
  cylindersRequested: number;
  urgency: UrgencyType;
  queuePosition: number;
  status: BookingStatus;
  priorityScore: number;
}

export interface AlertItem {
  id: string;
  message: string;
  severity: "medium" | "high";
}
