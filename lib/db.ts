import { db } from "./sqlite";
import type { CustomerProfile } from "@/types";

type Urgency = "medical" | "bpl" | "regular";
type PriorityBand = "low" | "medium" | "high";
type MlSource = "ml-service" | "heuristic-fallback";
type BookingStatus = "pending" | "delivered" | "cancelled";
type RebookingRequestStatus = "pending" | "approved" | "rejected";

export const BOOKING_LOCK_DAYS = 30;
export const MAX_LOCK_PERIOD_REQUESTS = 2;

function mapHousehold(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    address: row.address,
    pincode: row.pincode,
    aadhaarMasked: row.aadhaar_masked,
    phoneMasked: row.phone_masked,
    bpl: Boolean(row.bpl),
    lastBookingDate: row.last_booking_date,
    locationChanges30d: row.location_changes_30d,
  };
}

function mapDistributor(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    district: row.district,
    pincode: row.pincode,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    stock: row.stock,
  };
}

function mapBooking(row: any) {
  return {
    id: row.id,
    householdId: row.household_id,
    distributorId: row.distributor_id,
    requestDate: row.request_date,
    cylindersRequested: row.cylinders_requested,
    urgency: row.urgency,
    queuePosition: row.queue_position,
    status: row.status,
    priorityScore: row.priority_score,
    priorityBand: row.priority_band,
    mlSource: row.ml_source,
  };
}

function mapRebookingRequest(row: any) {
  return {
    id: row.id,
    householdId: row.household_id,
    distributorId: row.distributor_id,
    urgency: row.urgency,
    cylindersRequested: row.cylinders_requested,
    priorityScore: row.priority_score,
    priorityBand: row.priority_band,
    mlSource: row.ml_source,
    status: row.status,
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    approvedBookingId: row.approved_booking_id,
  };
}

export async function getHouseholds() {
  const households = db
    .prepare("SELECT * FROM households ORDER BY name ASC")
    .all()
    .map(mapHousehold);

  const bookingsStmt = db.prepare(
    "SELECT * FROM bookings WHERE household_id = ? ORDER BY request_date DESC"
  );

  return households.map((h: { id: string }) => ({
    ...h,
    bookings: bookingsStmt.all(h.id).map(mapBooking),
  }));
}

export async function getHouseholdById(id: string) {
  const row = db.prepare("SELECT * FROM households WHERE id = ?").get(id) as any;
  if (!row) return null;

  const bookings = db
    .prepare(
      `
      SELECT b.*, d.id as d_id, d.user_id as d_user_id, d.name as d_name,
             d.district as d_district, d.pincode as d_pincode,
             d.address as d_address, d.lat as d_lat, d.lng as d_lng, d.stock as d_stock
      FROM bookings b
      JOIN distributors d ON d.id = b.distributor_id
      WHERE b.household_id = ?
      ORDER BY b.request_date DESC
    `
    )
    .all(id)
    .map((b: any) => ({
      ...mapBooking(b),
      distributor: {
        id: b.d_id,
        userId: b.d_user_id,
        name: b.d_name,
        district: b.d_district,
        pincode: b.d_pincode,
        address: b.d_address,
        lat: b.d_lat,
        lng: b.d_lng,
        stock: b.d_stock,
      },
    }));

  return { ...mapHousehold(row), bookings };
}

export async function getHouseholdByUserId(userId: string) {
  const row = db
    .prepare("SELECT * FROM households WHERE user_id = ?")
    .get(userId) as any;
  if (!row) return null;
  return getHouseholdById(row.id);
}

export async function getDistributors() {
  const distributors = db
    .prepare("SELECT * FROM distributors ORDER BY name ASC")
    .all()
    .map(mapDistributor);

  const bookingsStmt = db.prepare(
    "SELECT * FROM bookings WHERE distributor_id = ? ORDER BY priority_score DESC"
  );

  return distributors.map((d: { id: string }) => ({
    ...d,
    bookings: bookingsStmt.all(d.id).map(mapBooking),
  }));
}

export async function getDistributorById(id: string) {
  const row = db.prepare("SELECT * FROM distributors WHERE id = ?").get(id) as any;
  if (!row) return null;

  const bookings = db
    .prepare(
      `
      SELECT b.*, h.id as h_id, h.user_id as h_user_id, h.name as h_name,
             h.address as h_address, h.pincode as h_pincode,
             h.aadhaar_masked as h_aadhaar_masked, h.phone_masked as h_phone_masked,
             h.bpl as h_bpl, h.last_booking_date as h_last_booking_date,
             h.location_changes_30d as h_location_changes_30d
      FROM bookings b
      JOIN households h ON h.id = b.household_id
      WHERE b.distributor_id = ?
      ORDER BY b.priority_score DESC
    `
    )
    .all(id)
    .map((b: any) => ({
      ...mapBooking(b),
      household: {
        id: b.h_id,
        userId: b.h_user_id,
        name: b.h_name,
        address: b.h_address,
        pincode: b.h_pincode,
        aadhaarMasked: b.h_aadhaar_masked,
        phoneMasked: b.h_phone_masked,
        bpl: Boolean(b.h_bpl),
        lastBookingDate: b.h_last_booking_date,
        locationChanges30d: b.h_location_changes_30d,
      },
    }));

  return { ...mapDistributor(row), bookings };
}

export async function getDistributorByUserId(userId: string) {
  const row = db
    .prepare("SELECT * FROM distributors WHERE user_id = ?")
    .get(userId) as any;
  if (!row) return null;
  return getDistributorById(row.id);
}

export async function getBookings() {
  const rows = db
    .prepare(
      `
      SELECT b.*, h.id as h_id, h.user_id as h_user_id, h.name as h_name,
             h.address as h_address, h.pincode as h_pincode,
             h.aadhaar_masked as h_aadhaar_masked, h.phone_masked as h_phone_masked,
             h.bpl as h_bpl, h.last_booking_date as h_last_booking_date,
             h.location_changes_30d as h_location_changes_30d,
             d.id as d_id, d.user_id as d_user_id, d.name as d_name,
             d.district as d_district, d.pincode as d_pincode,
             d.address as d_address, d.lat as d_lat, d.lng as d_lng, d.stock as d_stock
      FROM bookings b
      JOIN households h ON h.id = b.household_id
      JOIN distributors d ON d.id = b.distributor_id
      ORDER BY b.request_date DESC
    `
    )
    .all();

  return rows.map((r: any) => ({
    ...mapBooking(r),
    household: {
      id: r.h_id,
      userId: r.h_user_id,
      name: r.h_name,
      address: r.h_address,
      pincode: r.h_pincode,
      aadhaarMasked: r.h_aadhaar_masked,
      phoneMasked: r.h_phone_masked,
      bpl: Boolean(r.h_bpl),
      lastBookingDate: r.h_last_booking_date,
      locationChanges30d: r.h_location_changes_30d,
    },
    distributor: {
      id: r.d_id,
      userId: r.d_user_id,
      name: r.d_name,
      district: r.d_district,
      pincode: r.d_pincode,
      address: r.d_address,
      lat: r.d_lat,
      lng: r.d_lng,
      stock: r.d_stock,
    },
  }));
}

export async function getPendingBookings() {
  return (await getBookings()).filter((b: { status: string }) => b.status === "pending");
}

export async function getBookingsByHouseholdId(householdId: string) {
  const rows = db
    .prepare(
      `
      SELECT b.*, d.id as d_id, d.user_id as d_user_id, d.name as d_name,
             d.district as d_district, d.pincode as d_pincode,
             d.address as d_address, d.lat as d_lat, d.lng as d_lng, d.stock as d_stock
      FROM bookings b
      JOIN distributors d ON d.id = b.distributor_id
      WHERE b.household_id = ?
      ORDER BY b.request_date DESC
    `
    )
    .all(householdId);

  return rows.map((r: any) => ({
    ...mapBooking(r),
    distributor: {
      id: r.d_id,
      userId: r.d_user_id,
      name: r.d_name,
      district: r.d_district,
      pincode: r.d_pincode,
      address: r.d_address,
      lat: r.d_lat,
      lng: r.d_lng,
      stock: r.d_stock,
    },
  }));
}

export async function getBookingsByDistributorId(distributorId: string) {
  const rows = db
    .prepare(
      `
      SELECT b.*, h.id as h_id, h.user_id as h_user_id, h.name as h_name,
             h.address as h_address, h.pincode as h_pincode,
             h.aadhaar_masked as h_aadhaar_masked, h.phone_masked as h_phone_masked,
             h.bpl as h_bpl, h.last_booking_date as h_last_booking_date,
             h.location_changes_30d as h_location_changes_30d
      FROM bookings b
      JOIN households h ON h.id = b.household_id
      WHERE b.distributor_id = ?
      ORDER BY b.priority_score DESC
    `
    )
    .all(distributorId);

  return rows.map((r: any) => ({
    ...mapBooking(r),
    household: {
      id: r.h_id,
      userId: r.h_user_id,
      name: r.h_name,
      address: r.h_address,
      pincode: r.h_pincode,
      aadhaarMasked: r.h_aadhaar_masked,
      phoneMasked: r.h_phone_masked,
      bpl: Boolean(r.h_bpl),
      lastBookingDate: r.h_last_booking_date,
      locationChanges30d: r.h_location_changes_30d,
    },
  }));
}

export async function createBooking(data: {
  householdId: string;
  distributorId: string;
  urgency: Urgency;
  cylindersRequested: number;
  priorityScore: number;
  priorityBand: PriorityBand;
  mlSource: MlSource;
  queuePosition?: number;
}) {
  const id = `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const queuePosition = data.queuePosition ?? Math.ceil(Math.random() * 15);
  const requestDate = new Date().toISOString().split("T")[0];
  const createdAt = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO bookings (
      id, household_id, distributor_id, request_date, cylinders_requested,
      urgency, queue_position, status, priority_score, priority_band, ml_source, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    data.householdId,
    data.distributorId,
    requestDate,
    data.cylindersRequested,
    data.urgency,
    queuePosition,
    "pending",
    data.priorityScore,
    data.priorityBand,
    data.mlSource,
    createdAt
  );

  db.prepare("UPDATE households SET last_booking_date = ? WHERE id = ?").run(
    requestDate,
    data.householdId
  );

  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as any;
  const household = await getHouseholdById(data.householdId);
  const distributor = await getDistributorById(data.distributorId);

  return {
    ...mapBooking(booking),
    household,
    distributor,
  };
}

function toDay(value: string) {
  return new Date(`${value}T00:00:00`);
}

export async function getBookingLockStatus(householdId: string) {
  const row = db
    .prepare(
      `
      SELECT request_date
      FROM bookings
      WHERE household_id = ?
      ORDER BY request_date DESC, created_at DESC
      LIMIT 1
    `
    )
    .get(householdId) as { request_date?: string } | undefined;

  if (!row?.request_date) {
    return {
      lockDays: BOOKING_LOCK_DAYS,
      isLocked: false,
      remainingDays: 0,
      lastBookingDate: null,
    };
  }

  const now = new Date();
  const last = toDay(row.request_date);
  const daysElapsed = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(0, BOOKING_LOCK_DAYS - daysElapsed);

  return {
    lockDays: BOOKING_LOCK_DAYS,
    isLocked: remainingDays > 0,
    remainingDays,
    lastBookingDate: row.request_date,
  };
}

export async function getLockPeriodRequestAllowance(householdId: string) {
  const lockStatus = await getBookingLockStatus(householdId);

  if (!lockStatus.lastBookingDate) {
    return {
      ...lockStatus,
      maxRequests: MAX_LOCK_PERIOD_REQUESTS,
      usedRequests: 0,
      remainingRequests: MAX_LOCK_PERIOD_REQUESTS,
    };
  }

  const usedRequests = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM rebooking_requests
      WHERE household_id = ?
        AND requested_at >= ?
    `
    )
    .get(householdId, `${lockStatus.lastBookingDate}T00:00:00.000Z`) as {
    count: number;
  };

  const used = usedRequests?.count ?? 0;
  const remaining = Math.max(0, MAX_LOCK_PERIOD_REQUESTS - used);

  return {
    ...lockStatus,
    maxRequests: MAX_LOCK_PERIOD_REQUESTS,
    usedRequests: used,
    remainingRequests: remaining,
  };
}

async function getRebookingRequestById(id: string) {
  const row = db
    .prepare(
      `
      SELECT r.*, h.name as h_name, h.pincode as h_pincode,
             d.name as d_name, d.pincode as d_pincode
      FROM rebooking_requests r
      JOIN households h ON h.id = r.household_id
      JOIN distributors d ON d.id = r.distributor_id
      WHERE r.id = ?
    `
    )
    .get(id) as any;

  if (!row) return null;

  return {
    ...mapRebookingRequest(row),
    household: {
      id: row.household_id,
      name: row.h_name,
      pincode: row.h_pincode,
    },
    distributor: {
      id: row.distributor_id,
      name: row.d_name,
      pincode: row.d_pincode,
    },
  };
}

export async function getRebookingRequests(filters?: {
  status?: RebookingRequestStatus;
  householdId?: string;
}) {
  const conditions: string[] = [];
  const params: Array<string> = [];

  if (filters?.status) {
    conditions.push("r.status = ?");
    params.push(filters.status);
  }

  if (filters?.householdId) {
    conditions.push("r.household_id = ?");
    params.push(filters.householdId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `
      SELECT r.*, h.name as h_name, h.pincode as h_pincode,
             d.name as d_name, d.pincode as d_pincode
      FROM rebooking_requests r
      JOIN households h ON h.id = r.household_id
      JOIN distributors d ON d.id = r.distributor_id
      ${whereClause}
      ORDER BY r.requested_at DESC
    `
    )
    .all(...params) as any[];

  return rows.map((row) => ({
    ...mapRebookingRequest(row),
    household: {
      id: row.household_id,
      name: row.h_name,
      pincode: row.h_pincode,
    },
    distributor: {
      id: row.distributor_id,
      name: row.d_name,
      pincode: row.d_pincode,
    },
  }));
}

export async function createRebookingRequest(data: {
  householdId: string;
  distributorId: string;
  urgency: Urgency;
  cylindersRequested: number;
  priorityScore: number;
  priorityBand: PriorityBand;
  mlSource: MlSource;
  reviewNote?: string;
}) {
  const id = `rbreq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const requestedAt = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO rebooking_requests (
      id, household_id, distributor_id, urgency, cylinders_requested,
      priority_score, priority_band, ml_source, status, requested_at, review_note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `
  ).run(
    id,
    data.householdId,
    data.distributorId,
    data.urgency,
    data.cylindersRequested,
    data.priorityScore,
    data.priorityBand,
    data.mlSource,
    requestedAt,
    data.reviewNote ?? null
  );

  return getRebookingRequestById(id);
}

export async function reviewRebookingRequest(data: {
  requestId: string;
  decision: "approved" | "rejected";
  reviewNote?: string;
}) {
  const current = db
    .prepare("SELECT * FROM rebooking_requests WHERE id = ?")
    .get(data.requestId) as any;

  if (!current) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (current.status !== "pending") {
    return { ok: false as const, reason: "already_reviewed" as const };
  }

  const now = new Date().toISOString();

  if (data.decision === "rejected") {
    db.prepare(
      `
      UPDATE rebooking_requests
      SET status = 'rejected', reviewed_at = ?, review_note = ?
      WHERE id = ?
    `
    ).run(now, data.reviewNote ?? null, data.requestId);

    const request = await getRebookingRequestById(data.requestId);
    return { ok: true as const, request, booking: null };
  }

  const bookingId = `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const queuePosition = Math.ceil(Math.random() * 15);
  const requestDate = now.split("T")[0];

  const tx = db.transaction(() => {
    db.prepare(
      `
      INSERT INTO bookings (
        id, household_id, distributor_id, request_date, cylinders_requested,
        urgency, queue_position, status, priority_score, priority_band, ml_source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)
    `
    ).run(
      bookingId,
      current.household_id,
      current.distributor_id,
      requestDate,
      current.cylinders_requested,
      current.urgency,
      queuePosition,
      current.priority_score ?? 50,
      current.priority_band ?? "medium",
      current.ml_source ?? "heuristic-fallback",
      now
    );

    db.prepare("UPDATE households SET last_booking_date = ? WHERE id = ?").run(
      requestDate,
      current.household_id
    );

    db.prepare(
      `
      UPDATE rebooking_requests
      SET status = 'approved', reviewed_at = ?, review_note = ?, approved_booking_id = ?
      WHERE id = ?
    `
    ).run(now, data.reviewNote ?? null, bookingId, data.requestId);
  });

  tx();

  const request = await getRebookingRequestById(data.requestId);
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId) as any;

  return {
    ok: true as const,
    request,
    booking: booking ? mapBooking(booking) : null,
  };
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, bookingId);
  return db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
}

export async function updateBookingPriority(
  bookingId: string,
  priorityScore?: number,
  priorityBand?: PriorityBand,
  mlSource?: MlSource
) {
  const current = db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId) as any;
  if (!current) {
    return null;
  }

  db.prepare(
    `
    UPDATE bookings
    SET priority_score = ?, priority_band = ?, ml_source = ?
    WHERE id = ?
  `
  ).run(
    priorityScore ?? current.priority_score,
    priorityBand ?? current.priority_band,
    mlSource ?? current.ml_source,
    bookingId
  );

  return db.prepare("SELECT * FROM bookings WHERE id = ?").get(bookingId);
}

export async function getCrisisLevel(): Promise<"normal" | "alert" | "emergency"> {
  const row = db
    .prepare("SELECT value FROM system_config WHERE key = 'crisis_level'")
    .get() as { value?: "normal" | "alert" | "emergency" } | undefined;

  return row?.value ?? "normal";
}

export async function setCrisisLevel(level: "normal" | "alert" | "emergency") {
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO system_config (key, value, updated_at)
    VALUES ('crisis_level', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `
  ).run(level, now);
  return level;
}

export async function updateDistributorStock(distributorId: string, stock: number) {
  db.prepare("UPDATE distributors SET stock = ? WHERE id = ?").run(stock, distributorId);
  return db.prepare("SELECT * FROM distributors WHERE id = ?").get(distributorId);
}

export async function logPrediction(data: {
  bookingId?: string;
  inputFeatures: Record<string, unknown>;
  predictedScore: number;
  priorityBand: string;
  source: string;
}) {
  const id = `pred-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO prediction_logs (
      id, booking_id, input_features, predicted_score, priority_band, source, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    data.bookingId ?? null,
    JSON.stringify(data.inputFeatures),
    data.predictedScore,
    data.priorityBand,
    data.source,
    timestamp
  );

  return db.prepare("SELECT * FROM prediction_logs WHERE id = ?").get(id);
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function maskPhone(phone: string) {
  const clean = normalizePhone(phone);
  return `${clean.slice(0, 2)}XXXX${clean.slice(-4)}`;
}

function maskAadhaar(last4: string) {
  return `XXXX-XXXX-${last4}`;
}

export async function logLoginEvent(data: {
  userId?: string;
  role: "customer" | "distributor" | "admin";
  loginId: string;
  method: "password" | "otp" | "signup";
  success: boolean;
  message?: string;
}) {
  const id = `login-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const createdAt = new Date().toISOString();

  db.prepare(
    `
    INSERT INTO login_events (id, user_id, role, login_id, method, success, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    id,
    data.userId ?? null,
    data.role,
    data.loginId,
    data.method,
    data.success ? 1 : 0,
    data.message ?? null,
    createdAt
  );
}

export async function authenticateRoleLogin(data: {
  role: "distributor" | "admin";
  loginId: string;
  password: string;
}) {
  const loginId = data.loginId.trim().toUpperCase();

  const row = db
    .prepare(
      `
      SELECT a.user_id, a.password
      FROM auth_accounts a
      WHERE a.role = ? AND a.login_id = ?
    `
    )
    .get(data.role, loginId) as { user_id: string; password: string | null } | undefined;

  const isValid = Boolean(row && row.password && row.password === data.password);

  await logLoginEvent({
    userId: row?.user_id,
    role: data.role,
    loginId,
    method: "password",
    success: isValid,
    message: isValid ? "login_success" : "invalid_credentials",
  });

  return {
    ok: isValid,
    userId: row?.user_id,
  };
}

export async function getCustomerByPhone(phone: string) {
  const cleanPhone = normalizePhone(phone);

  const row = db
    .prepare(
      `
      SELECT u.id as user_id, h.id as household_id, h.name, h.address, h.pincode,
             h.aadhaar_masked, h.phone_masked, h.bpl, h.last_booking_date,
             h.location_changes_30d
      FROM users u
      JOIN households h ON h.user_id = u.id
      WHERE u.role = 'customer' AND u.phone = ?
    `
    )
    .get(cleanPhone) as
    | {
        user_id: string;
        household_id: string;
        name: string;
        address: string;
        pincode: string;
        aadhaar_masked: string;
        phone_masked: string;
        bpl: number;
        last_booking_date: string;
        location_changes_30d: number;
      }
    | undefined;

  if (!row) return null;

  return {
    userId: row.user_id,
    household: {
      id: row.household_id,
      userId: row.user_id,
      name: row.name,
      address: row.address,
      pincode: row.pincode,
      aadhaarMasked: row.aadhaar_masked,
      phoneMasked: row.phone_masked,
      bpl: Boolean(row.bpl),
      lastBookingDate: row.last_booking_date,
      locationChanges30d: row.location_changes_30d,
    },
  };
}

export async function registerCustomer(profile: CustomerProfile) {
  const phone = normalizePhone(profile.phone);
  const userId = `u-cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const householdId = `hh-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const authId = `auth-${userId}`;
  const now = new Date().toISOString();

  const existing = db
    .prepare("SELECT id FROM users WHERE role = 'customer' AND phone = ?")
    .get(phone) as { id: string } | undefined;

  if (existing) {
    return { ok: false as const, reason: "phone_exists" as const };
  }

  const email = `customer-${phone}@gasmitra.local`;

  const tx = db.transaction(() => {
    db.prepare(
      `
      INSERT INTO users (id, email, phone, role, created_at)
      VALUES (?, ?, ?, 'customer', ?)
    `
    ).run(userId, email, phone, now);

    db.prepare(
      `
      INSERT INTO households (
        id, user_id, name, address, pincode, aadhaar_masked, phone_masked,
        bpl, last_booking_date, location_changes_30d, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    ).run(
      householdId,
      userId,
      profile.name.trim(),
      `User provided address (${profile.pincode})`,
      profile.pincode,
      maskAadhaar(profile.aadhaarLast4),
      maskPhone(phone),
      0,
      now.split("T")[0],
      0,
      now
    );

    db.prepare(
      `
      INSERT INTO auth_accounts (id, user_id, role, login_id, password, created_at)
      VALUES (?, ?, 'customer', ?, NULL, ?)
    `
    ).run(authId, userId, phone, now);
  });

  tx();

  await logLoginEvent({
    userId,
    role: "customer",
    loginId: phone,
    method: "signup",
    success: true,
    message: "signup_success",
  });

  return {
    ok: true as const,
    userId,
    household: {
      id: householdId,
      userId,
      name: profile.name.trim(),
      address: `User provided address (${profile.pincode})`,
      pincode: profile.pincode,
      aadhaarMasked: maskAadhaar(profile.aadhaarLast4),
      phoneMasked: maskPhone(phone),
      bpl: false,
      lastBookingDate: now.split("T")[0],
      locationChanges30d: 0,
    },
  };
}

export async function verifyCustomerOtpLogin(phone: string, otp: string) {
  const cleanPhone = normalizePhone(phone);
  const isValidOtp = /^\d{6}$/.test(otp);

  const customer = await getCustomerByPhone(cleanPhone);
  const success = Boolean(customer && isValidOtp);

  await logLoginEvent({
    userId: customer?.userId,
    role: "customer",
    loginId: cleanPhone,
    method: "otp",
    success,
    message: success ? "otp_login_success" : "otp_login_failed",
  });

  if (!customer || !isValidOtp) {
    return { ok: false as const };
  }

  return {
    ok: true as const,
    userId: customer.userId,
    household: customer.household,
  };
}
