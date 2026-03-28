import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "database.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function seedIfEmpty() {
  const householdCount = db
    .prepare("SELECT COUNT(*) as count FROM households")
    .get() as { count: number };

  if (householdCount.count > 0) {
    return;
  }

  const now = new Date().toISOString();

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, phone, role, created_at)
    VALUES (@id, @email, @phone, @role, @created_at)
  `);

  const insertHousehold = db.prepare(`
    INSERT INTO households (
      id, user_id, name, address, pincode, aadhaar_masked, phone_masked,
      bpl, last_booking_date, location_changes_30d, created_at
    ) VALUES (
      @id, @user_id, @name, @address, @pincode, @aadhaar_masked, @phone_masked,
      @bpl, @last_booking_date, @location_changes_30d, @created_at
    )
  `);

  const insertDistributor = db.prepare(`
    INSERT INTO distributors (
      id, user_id, name, district, pincode, address, lat, lng, stock, created_at
    ) VALUES (
      @id, @user_id, @name, @district, @pincode, @address, @lat, @lng, @stock, @created_at
    )
  `);

  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      id, household_id, distributor_id, request_date, cylinders_requested,
      urgency, queue_position, status, priority_score, priority_band, ml_source, created_at
    ) VALUES (
      @id, @household_id, @distributor_id, @request_date, @cylinders_requested,
      @urgency, @queue_position, @status, @priority_score, @priority_band, @ml_source, @created_at
    )
  `);

  const insertAuthAccount = db.prepare(`
    INSERT INTO auth_accounts (
      id, user_id, role, login_id, password, created_at
    ) VALUES (
      @id, @user_id, @role, @login_id, @password, @created_at
    )
  `);

  const tx = db.transaction(() => {
    // Admin
    insertUser.run({
      id: "u-admin-1",
      email: "admin@gasmitra.local",
      phone: "9000000000",
      role: "admin",
      created_at: now,
    });

    // Distributor users
    const distributorUsers = [
      { id: "u-dist-1", email: "dist-aurangabad@gasmitra.local", phone: "9111111111" },
      { id: "u-dist-2", email: "dist-nashik@gasmitra.local", phone: "9222222222" },
      { id: "u-dist-3", email: "dist-mumbai@gasmitra.local", phone: "9333333333" },
      { id: "u-dist-4", email: "dist-pune@gasmitra.local", phone: "9444444444" },
    ];

    distributorUsers.forEach((u) => {
      insertUser.run({ ...u, role: "distributor", created_at: now });
    });

    // Customer users
    const customerUsers = [
      { id: "u-cust-1", email: "anita@gasmitra.local", phone: "9801234501" },
      { id: "u-cust-2", email: "rahul@gasmitra.local", phone: "9701021234" },
      { id: "u-cust-3", email: "saira@gasmitra.local", phone: "9008821567" },
      { id: "u-cust-4", email: "deepak@gasmitra.local", phone: "9756342891" },
      { id: "u-cust-5", email: "priya@gasmitra.local", phone: "9945678123" },
      { id: "u-cust-6", email: "vikram@gasmitra.local", phone: "9834567890" },
      { id: "u-cust-7", email: "farha@gasmitra.local", phone: "9887001234" },
      { id: "u-cust-8", email: "manoj@gasmitra.local", phone: "9765400012" },
      { id: "u-cust-9", email: "savita@gasmitra.local", phone: "9822305678" },
      { id: "u-cust-10", email: "ramesh@gasmitra.local", phone: "9876543200" },
      { id: "u-cust-11", email: "lata@gasmitra.local", phone: "9811198765" },
      { id: "u-cust-12", email: "imran@gasmitra.local", phone: "9900088888" },
    ];

    customerUsers.forEach((u) => {
      insertUser.run({ ...u, role: "customer", created_at: now });
    });

    insertAuthAccount.run({
      id: "auth-admin-1",
      user_id: "u-admin-1",
      role: "admin",
      login_id: "ADMIN001",
      password: "admin@123",
      created_at: now,
    });

    const distributorCredentials = [
      { id: "auth-dist-1", user_id: "u-dist-1", login_id: "DIST001", password: "dist@123" },
      { id: "auth-dist-2", user_id: "u-dist-2", login_id: "DIST002", password: "dist@456" },
      { id: "auth-dist-3", user_id: "u-dist-3", login_id: "DIST003", password: "dist@789" },
      { id: "auth-dist-4", user_id: "u-dist-4", login_id: "DIST004", password: "dist@321" },
    ];

    distributorCredentials.forEach((acc) => {
      insertAuthAccount.run({
        ...acc,
        role: "distributor",
        created_at: now,
      });
    });

    customerUsers.forEach((u, idx) => {
      insertAuthAccount.run({
        id: `auth-cust-${idx + 1}`,
        user_id: u.id,
        role: "customer",
        login_id: u.phone,
        password: null,
        created_at: now,
      });
    });

    const distributors = [
      {
        id: "dist-1",
        user_id: "u-dist-1",
        name: "MahaGas Aurangabad",
        district: "Aurangabad",
        pincode: "431001",
        address: "CIDCO, Aurangabad",
        lat: 19.8762,
        lng: 75.3433,
        stock: 45,
        created_at: now,
      },
      {
        id: "dist-2",
        user_id: "u-dist-2",
        name: "Sahyadri LPG Nashik",
        district: "Nashik",
        pincode: "422001",
        address: "College Road, Nashik",
        lat: 19.9975,
        lng: 73.7898,
        stock: 62,
        created_at: now,
      },
      {
        id: "dist-3",
        user_id: "u-dist-3",
        name: "Seva Gas Mumbai",
        district: "Mumbai",
        pincode: "400001",
        address: "Fort, Mumbai",
        lat: 18.9388,
        lng: 72.8354,
        stock: 28,
        created_at: now,
      },
      {
        id: "dist-4",
        user_id: "u-dist-4",
        name: "Pune Urban LPG",
        district: "Pune",
        pincode: "411001",
        address: "Camp, Pune",
        lat: 18.5204,
        lng: 73.8567,
        stock: 71,
        created_at: now,
      },
    ];

    distributors.forEach((d) => insertDistributor.run(d));

    const households = [
      {
        id: "hh-1",
        user_id: "u-cust-1",
        name: "Anita Patil",
        address: "Ward 4, Jalna Road, Aurangabad",
        pincode: "431001",
        aadhaar_masked: "XXXX-XXXX-1298",
        phone_masked: "98XXXX4501",
        bpl: 1,
        last_booking_date: "2026-03-01",
        location_changes_30d: 0,
        created_at: now,
      },
      {
        id: "hh-2",
        user_id: "u-cust-2",
        name: "Rahul Deshmukh",
        address: "Shivaji Nagar, Nashik",
        pincode: "422001",
        aadhaar_masked: "XXXX-XXXX-7745",
        phone_masked: "97XXXX1021",
        bpl: 0,
        last_booking_date: "2026-03-20",
        location_changes_30d: 0,
        created_at: now,
      },
      {
        id: "hh-3",
        user_id: "u-cust-3",
        name: "Saira Shaikh",
        address: "Bandra East, Mumbai",
        pincode: "400001",
        aadhaar_masked: "XXXX-XXXX-4488",
        phone_masked: "90XXXX8821",
        bpl: 1,
        last_booking_date: "2026-02-19",
        location_changes_30d: 1,
        created_at: now,
      },
      {
        id: "hh-4",
        user_id: "u-cust-4",
        name: "Deepak Kumar",
        address: "Civil Lines, Aurangabad",
        pincode: "431001",
        aadhaar_masked: "XXXX-XXXX-5612",
        phone_masked: "97XXXX3421",
        bpl: 0,
        last_booking_date: "2026-03-15",
        location_changes_30d: 0,
        created_at: now,
      },
      {
        id: "hh-5",
        user_id: "u-cust-5",
        name: "Priya Sharma",
        address: "Dadar, Mumbai",
        pincode: "400001",
        aadhaar_masked: "XXXX-XXXX-9087",
        phone_masked: "90XXXX5678",
        bpl: 0,
        last_booking_date: "2026-03-25",
        location_changes_30d: 2,
        created_at: now,
      },
      {
        id: "hh-6",
        user_id: "u-cust-6",
        name: "Vikram Singh",
        address: "Hinjewadi, Pune",
        pincode: "411001",
        aadhaar_masked: "XXXX-XXXX-3456",
        phone_masked: "98XXXX2109",
        bpl: 1,
        last_booking_date: "2026-02-28",
        location_changes_30d: 0,
        created_at: now,
      },
      {
        id: "hh-7",
        user_id: "u-cust-7",
        name: "Farha Khan",
        address: "Kurla West, Mumbai",
        pincode: "400070",
        aadhaar_masked: "XXXX-XXXX-1109",
        phone_masked: "98XXXX0123",
        bpl: 1,
        last_booking_date: "2026-01-29",
        location_changes_30d: 1,
        created_at: now,
      },
      {
        id: "hh-8",
        user_id: "u-cust-8",
        name: "Manoj Wagh",
        address: "Satpur, Nashik",
        pincode: "422007",
        aadhaar_masked: "XXXX-XXXX-7722",
        phone_masked: "97XXXX0012",
        bpl: 0,
        last_booking_date: "2026-03-10",
        location_changes_30d: 0,
        created_at: now,
      },
      {
        id: "hh-9",
        user_id: "u-cust-9",
        name: "Savita Jagtap",
        address: "Kothrud, Pune",
        pincode: "411038",
        aadhaar_masked: "XXXX-XXXX-3311",
        phone_masked: "98XXXX5678",
        bpl: 0,
        last_booking_date: "2026-02-12",
        location_changes_30d: 1,
        created_at: now,
      },
      {
        id: "hh-10",
        user_id: "u-cust-10",
        name: "Ramesh Kale",
        address: "Paithan Gate, Aurangabad",
        pincode: "431001",
        aadhaar_masked: "XXXX-XXXX-6677",
        phone_masked: "98XXXX3200",
        bpl: 1,
        last_booking_date: "2026-03-05",
        location_changes_30d: 0,
        created_at: now,
      },
      {
        id: "hh-11",
        user_id: "u-cust-11",
        name: "Lata More",
        address: "Ghatkopar, Mumbai",
        pincode: "400086",
        aadhaar_masked: "XXXX-XXXX-2244",
        phone_masked: "98XXXX8765",
        bpl: 0,
        last_booking_date: "2026-03-21",
        location_changes_30d: 2,
        created_at: now,
      },
      {
        id: "hh-12",
        user_id: "u-cust-12",
        name: "Imran Sheikh",
        address: "Yerwada, Pune",
        pincode: "411006",
        aadhaar_masked: "XXXX-XXXX-9191",
        phone_masked: "99XXXX8888",
        bpl: 1,
        last_booking_date: "2026-02-07",
        location_changes_30d: 0,
        created_at: now,
      },
    ];

    households.forEach((h) => insertHousehold.run(h));

    const bookings = [
      {
        id: "bk-1001",
        household_id: "hh-1",
        distributor_id: "dist-1",
        request_date: "2026-03-24",
        cylinders_requested: 1,
        urgency: "medical",
        queue_position: 3,
        status: "pending",
        priority_score: 85.2,
        priority_band: "high",
        ml_source: "ml-service",
        created_at: now,
      },
      {
        id: "bk-1002",
        household_id: "hh-2",
        distributor_id: "dist-2",
        request_date: "2026-03-22",
        cylinders_requested: 1,
        urgency: "regular",
        queue_position: 9,
        status: "delivered",
        priority_score: 52.1,
        priority_band: "medium",
        ml_source: "ml-service",
        created_at: now,
      },
      {
        id: "bk-1003",
        household_id: "hh-3",
        distributor_id: "dist-3",
        request_date: "2026-03-23",
        cylinders_requested: 1,
        urgency: "bpl",
        queue_position: 5,
        status: "pending",
        priority_score: 68.7,
        priority_band: "medium",
        ml_source: "ml-service",
        created_at: now,
      },
      {
        id: "bk-1004",
        household_id: "hh-7",
        distributor_id: "dist-3",
        request_date: "2026-03-26",
        cylinders_requested: 2,
        urgency: "medical",
        queue_position: 1,
        status: "pending",
        priority_score: 92.5,
        priority_band: "high",
        ml_source: "ml-service",
        created_at: now,
      },
      {
        id: "bk-1005",
        household_id: "hh-10",
        distributor_id: "dist-1",
        request_date: "2026-03-27",
        cylinders_requested: 1,
        urgency: "bpl",
        queue_position: 2,
        status: "pending",
        priority_score: 79.8,
        priority_band: "high",
        ml_source: "ml-service",
        created_at: now,
      },
      {
        id: "bk-1006",
        household_id: "hh-11",
        distributor_id: "dist-3",
        request_date: "2026-03-21",
        cylinders_requested: 1,
        urgency: "regular",
        queue_position: 11,
        status: "delivered",
        priority_score: 36.4,
        priority_band: "low",
        ml_source: "ml-service",
        created_at: now,
      },
      {
        id: "bk-1007",
        household_id: "hh-12",
        distributor_id: "dist-4",
        request_date: "2026-03-18",
        cylinders_requested: 2,
        urgency: "medical",
        queue_position: 4,
        status: "pending",
        priority_score: 88.9,
        priority_band: "high",
        ml_source: "ml-service",
        created_at: now,
      },
      {
        id: "bk-1008",
        household_id: "hh-8",
        distributor_id: "dist-2",
        request_date: "2026-03-19",
        cylinders_requested: 1,
        urgency: "regular",
        queue_position: 8,
        status: "pending",
        priority_score: 47.2,
        priority_band: "medium",
        ml_source: "ml-service",
        created_at: now,
      },
    ];

    bookings.forEach((b) => insertBooking.run(b));

    db.prepare(
      "INSERT INTO system_config (key, value, updated_at) VALUES (?, ?, ?)"
    ).run("crisis_level", "normal", now);
  });

  tx();
}

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('customer', 'distributor', 'admin')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS households (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      pincode TEXT NOT NULL,
      aadhaar_masked TEXT NOT NULL,
      phone_masked TEXT NOT NULL,
      bpl INTEGER NOT NULL CHECK (bpl IN (0, 1)),
      last_booking_date TEXT,
      location_changes_30d INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS distributors (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      pincode TEXT NOT NULL,
      address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL,
      distributor_id TEXT NOT NULL,
      request_date TEXT NOT NULL,
      cylinders_requested INTEGER NOT NULL,
      urgency TEXT NOT NULL CHECK (urgency IN ('medical', 'bpl', 'regular')),
      queue_position INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'cancelled')),
      priority_score REAL NOT NULL,
      priority_band TEXT NOT NULL CHECK (priority_band IN ('low', 'medium', 'high')),
      ml_source TEXT NOT NULL CHECK (ml_source IN ('ml-service', 'heuristic-fallback')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
      FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rebooking_requests (
      id TEXT PRIMARY KEY,
      household_id TEXT NOT NULL,
      distributor_id TEXT NOT NULL,
      urgency TEXT NOT NULL CHECK (urgency IN ('medical', 'bpl', 'regular')),
      cylinders_requested INTEGER NOT NULL,
      priority_score REAL,
      priority_band TEXT CHECK (priority_band IN ('low', 'medium', 'high')),
      ml_source TEXT CHECK (ml_source IN ('ml-service', 'heuristic-fallback')),
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
      requested_at TEXT NOT NULL,
      reviewed_at TEXT,
      review_note TEXT,
      approved_booking_id TEXT,
      FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
      FOREIGN KEY (distributor_id) REFERENCES distributors(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prediction_logs (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      input_features TEXT NOT NULL,
      predicted_score REAL NOT NULL,
      priority_band TEXT NOT NULL,
      source TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS auth_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('customer', 'distributor', 'admin')),
      login_id TEXT UNIQUE NOT NULL,
      password TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS login_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      role TEXT NOT NULL CHECK (role IN ('customer', 'distributor', 'admin')),
      login_id TEXT NOT NULL,
      method TEXT NOT NULL,
      success INTEGER NOT NULL CHECK (success IN (0, 1)),
      message TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_household ON bookings(household_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_distributor ON bookings(distributor_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_status_priority ON bookings(status, priority_score DESC);
    CREATE INDEX IF NOT EXISTS idx_rebooking_requests_status_requested_at ON rebooking_requests(status, requested_at DESC);
    CREATE INDEX IF NOT EXISTS idx_rebooking_requests_household ON rebooking_requests(household_id);
    CREATE INDEX IF NOT EXISTS idx_auth_accounts_role_login_id ON auth_accounts(role, login_id);
    CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON login_events(created_at DESC);
  `);
}

function ensureAuthAccounts() {
  const now = new Date().toISOString();

  db.prepare(
    `
    INSERT OR IGNORE INTO auth_accounts (id, user_id, role, login_id, password, created_at)
    VALUES ('auth-admin-1', 'u-admin-1', 'admin', 'ADMIN001', 'admin@123', ?)
  `
  ).run(now);

  const distributorSeed = [
    ["auth-dist-1", "u-dist-1", "DIST001", "dist@123"],
    ["auth-dist-2", "u-dist-2", "DIST002", "dist@456"],
    ["auth-dist-3", "u-dist-3", "DIST003", "dist@789"],
    ["auth-dist-4", "u-dist-4", "DIST004", "dist@321"],
  ];

  distributorSeed.forEach(([id, userId, loginId, password]) => {
    db.prepare(
      `
      INSERT OR IGNORE INTO auth_accounts (id, user_id, role, login_id, password, created_at)
      VALUES (?, ?, 'distributor', ?, ?, ?)
    `
    ).run(id, userId, loginId, password, now);
  });

  const customers = db
    .prepare("SELECT id, phone FROM users WHERE role = 'customer'")
    .all() as Array<{ id: string; phone: string }>;

  customers.forEach((c) => {
    db.prepare(
      `
      INSERT OR IGNORE INTO auth_accounts (id, user_id, role, login_id, password, created_at)
      VALUES (?, ?, 'customer', ?, NULL, ?)
    `
    ).run(`auth-${c.id}`, c.id, c.phone, now);
  });
}

function ensureDistributorBookingVolume(targetPerDistributor = 20) {
  const distributors = db
    .prepare("SELECT id FROM distributors ORDER BY id")
    .all() as Array<{ id: string }>;

  const households = db
    .prepare("SELECT id FROM households ORDER BY id")
    .all() as Array<{ id: string }>;

  if (distributors.length === 0 || households.length === 0) {
    return;
  }

  const bookingCountByDistributorStmt = db.prepare(
    "SELECT COUNT(*) as count FROM bookings WHERE distributor_id = ?"
  );

  const insertBooking = db.prepare(`
    INSERT INTO bookings (
      id, household_id, distributor_id, request_date, cylinders_requested,
      urgency, queue_position, status, priority_score, priority_band, ml_source, created_at
    ) VALUES (
      @id, @household_id, @distributor_id, @request_date, @cylinders_requested,
      @urgency, @queue_position, @status, @priority_score, @priority_band, @ml_source, @created_at
    )
  `);

  let seq = 0;

  const tx = db.transaction(() => {
    const now = new Date();

    distributors.forEach((distributor, distributorIdx) => {
      const row = bookingCountByDistributorStmt.get(distributor.id) as {
        count: number;
      };
      const existingCount = row?.count ?? 0;
      const missing = Math.max(0, targetPerDistributor - existingCount);

      for (let i = 0; i < missing; i += 1) {
        const n = existingCount + i + 1;
        const householdId =
          households[(n + distributorIdx * 3) % households.length].id;

        const daysAgo = 5 + ((n * 7 + distributorIdx * 11) % 120);
        const requestDateObj = new Date(now);
        requestDateObj.setDate(now.getDate() - daysAgo);

        const urgencyBucket = (n + distributorIdx) % 10;
        const urgency =
          urgencyBucket < 2
            ? "medical"
            : urgencyBucket < 5
            ? "bpl"
            : "regular";

        const cylindersRequested = n % 6 === 0 ? 2 : 1;
        const status = n % 4 === 0 ? "delivered" : "pending";

        const baseScore =
          urgency === "medical" ? 78 : urgency === "bpl" ? 65 : 42;
        const daysFactor = Math.min(18, Math.floor(daysAgo / 7));
        const statusBonus = status === "pending" ? 4 : 0;
        const priorityScore = Math.min(
          98,
          Math.max(25, baseScore + daysFactor + statusBonus)
        );

        const priorityBand =
          priorityScore >= 70
            ? "high"
            : priorityScore >= 40
            ? "medium"
            : "low";

        insertBooking.run({
          id: `bk-auto-${distributor.id}-${Date.now()}-${seq++}`,
          household_id: householdId,
          distributor_id: distributor.id,
          request_date: requestDateObj.toISOString().split("T")[0],
          cylinders_requested: cylindersRequested,
          urgency,
          queue_position: ((n - 1) % 25) + 1,
          status,
          priority_score: priorityScore,
          priority_band: priorityBand,
          ml_source: n % 5 === 0 ? "heuristic-fallback" : "ml-service",
          created_at: requestDateObj.toISOString(),
        });
      }
    });
  });

  tx();
}

createSchema();
seedIfEmpty();
ensureAuthAccounts();
ensureDistributorBookingVolume(20);

export { db, dbPath };
