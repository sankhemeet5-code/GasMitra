import { AlertItem, Booking, Distributor, Household } from "@/types";
import { calculatePriorityScore } from "@/lib/priority";

export const maharashtraPincodes = [
  "400001",
  "411001",
  "431001",
  "422001",
  "440001",
  "416001",
];

export const households: Household[] = [
  {
    id: "hh-1",
    name: "Anita Patil",
    address: "Ward 4, Jalna Road, Aurangabad, Maharashtra",
    pincode: "431001",
    aadhaarMasked: "XXXX-XXXX-1298",
    bpl: true,
    phoneMasked: "98XXXX4501",
    lastBookingDate: "2026-03-01",
  },
  {
    id: "hh-2",
    name: "Rahul Deshmukh",
    address: "Shivaji Nagar, Nashik, Maharashtra",
    pincode: "422001",
    aadhaarMasked: "XXXX-XXXX-7745",
    bpl: false,
    phoneMasked: "97XXXX1021",
    lastBookingDate: "2026-03-20",
  },
  {
    id: "hh-3",
    name: "Saira Shaikh",
    address: "Bandra East, Mumbai, Maharashtra",
    pincode: "400001",
    aadhaarMasked: "XXXX-XXXX-4488",
    bpl: true,
    phoneMasked: "90XXXX8821",
    lastBookingDate: "2026-02-19",
  },
];

export const distributors: Distributor[] = [
  {
    id: "dist-1",
    name: "MahaGas Aurangabad",
    pincode: "431001",
    district: "Aurangabad",
    address: "CIDCO, Aurangabad",
    lat: 19.8762,
    lng: 75.3433,
    stock: 36,
  },
  {
    id: "dist-2",
    name: "Sahyadri LPG Nashik",
    pincode: "422001",
    district: "Nashik",
    address: "College Road, Nashik",
    lat: 19.9975,
    lng: 73.7898,
    stock: 74,
  },
  {
    id: "dist-3",
    name: "Seva Gas Mumbai",
    pincode: "400001",
    district: "Mumbai",
    address: "Fort, Mumbai",
    lat: 18.9388,
    lng: 72.8354,
    stock: 18,
  },
  {
    id: "dist-4",
    name: "Pune Urban LPG",
    pincode: "411001",
    district: "Pune",
    address: "Camp, Pune",
    lat: 18.5204,
    lng: 73.8567,
    stock: 56,
  },
];

const b1 = calculatePriorityScore({
  lastBookingDate: "2026-03-01",
  isBpl: true,
  urgency: "medical",
}).score;

const b2 = calculatePriorityScore({
  lastBookingDate: "2026-03-20",
  isBpl: false,
  urgency: "regular",
}).score;

export const bookings: Booking[] = [
  {
    id: "bk-1123",
    householdId: "hh-1",
    distributorId: "dist-1",
    requestDate: "2026-03-24",
    cylindersRequested: 1,
    urgency: "medical",
    queuePosition: 3,
    status: "pending",
    priorityScore: b1,
  },
  {
    id: "bk-1045",
    householdId: "hh-2",
    distributorId: "dist-2",
    requestDate: "2026-03-22",
    cylindersRequested: 1,
    urgency: "regular",
    queuePosition: 9,
    status: "delivered",
    priorityScore: b2,
  },
];

export const suspiciousAlerts: AlertItem[] = [
  {
    id: "al-1",
    message: "3 bookings from same phone in 7 days (97XXXX1021)",
    severity: "high",
  },
  {
    id: "al-2",
    message: "2 household IDs linked to same delivery address",
    severity: "medium",
  },
];
