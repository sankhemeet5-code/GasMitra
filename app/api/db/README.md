# Database API Routes Documentation

This directory contains API endpoints that provide database access for the GasMitra application. These routes serve as the bridge between the Next.js frontend and the Prisma database.

## Endpoints Overview

### `/api/db/data` (GET)
Fetch all global data needed for the application.

**Response:**
```json
{
  "households": [...],
  "distributors": [...],
  "crisisLevel": "normal"
}
```

**Use Cases:**
- Dashboard initialization
- Loading households and distributors for selection dropdowns
- Getting current system crisis level

---

### `/api/db/bookings` (GET, POST)

#### GET - Fetch bookings for a household
**Parameters:**
- `householdId` (query, required): ID of the household

**Response:**
```json
[
  {
    "id": "booking-123",
    "householdId": "hh-123",
    "distributorId": "dist-456",
    "urgency": "medical",
    "cylindersRequested": 2,
    "status": "pending",
    "priorityScore": 85.2,
    "priorityBand": "high",
    "mlSource": "ml-service",
    "requestDate": "2024-01-15T10:30:00Z",
    "distributor": {...}
  }
]
```

**Use Cases:**
- Customer viewing their booking history
- Dashboard showing customer's recent bookings

#### POST - Create a new booking
**Request Body:**
```json
{
  "householdId": "hh-123",
  "distributorId": "dist-456",
  "urgency": "medical",
  "cylindersRequested": 2,
  "priorityScore": 85.2,
  "priorityBand": "high",
  "mlSource": "ml-service"
}
```

**Response:** Created booking object (201)

**Use Cases:**
- Customer booking a cylinder
- Admin/distributor creating booking on behalf of customer

---

### `/api/db/bookings/[id]` (PATCH)
Update booking status or priority information.

**Parameters:**
- `id` (path, required): Booking ID

**Request Body:**
```json
{
  "status": "delivered",
  "priorityScore": 85.2,
  "priorityBand": "high",
  "mlSource": "ml-service"
}
```

**Response:**
```json
{ "success": true }
```

**Use Cases:**
- Marking booking as delivered
- Updating prediction results after ML call
- Canceling booking

---

### `/api/db/households/[id]` (GET)
Fetch detailed information about a specific household.

**Parameters:**
- `id` (path, required): User ID associated with the household

**Response:**
```json
{
  "id": "hh-123",
  "userId": "user-123",
  "name": "Anita Patil",
  "phone": "9876543210",
  "address": "123 Main St, Aurangabad",
  "pincode": "431001",
  "bpl": true,
  "lastBookingDate": "2024-01-10T15:30:00Z",
  "locationChanges30d": 0,
  "bookings": [...]
}
```

**Use Cases:**
- Fetching customer profile for booking
- Getting customer data for ML predictions
- Displaying customer information in dashboard

---

### `/api/db/distributors/[id]` (GET, PATCH)

#### GET - Fetch bookings for a distributor
**Parameters:**
- `id` (path, required): Distributor ID
- `action` (query, optional): Set to "pending" to get system-wide pending bookings

**Response:**
```json
[
  {
    "id": "booking-123",
    "householdId": "hh-123",
    "cylindersRequested": 2,
    "urgency": "medical",
    "priorityScore": 85.2,
    "priorityBand": "high",
    "household": {...}
  }
]
```

**Use Cases:**
- Distributor viewing assigned bookings
- Getting smart queue of orders
- Admin viewing all pending bookings (with `action=pending`)

#### PATCH - Update distributor stock
**Request Body:**
```json
{
  "stock": 45
}
```

**Response:**
```json
{ "success": true }
```

**Use Cases:**
- Distributor updating current stock level
- Admin updating distributor inventory

---

### `/api/db/crisis` (GET, POST)

#### GET - Fetch current crisis level
**Response:**
```json
{
  "crisisLevel": "normal"
}
```

**Use Cases:**
- Dashboard displaying system status
- Determining if crisis mode features should be visible

#### POST - Update crisis level
**Request Body:**
```json
{
  "level": "alert"
}
```

Valid values: `"normal"` | `"alert"` | `"emergency"`

**Response:**
```json
{
  "crisisLevel": "alert"
}
```

**Use Cases:**
- Admin setting system-wide crisis level
- Triggering crisis mode policies

---

### `/api/db/predictions` (POST)
Log a prediction for audit trail and analytics.

**Request Body:**
```json
{
  "bookingId": "booking-123",
  "inputFeatures": {
    "days_since_last_booking": 27,
    "is_bpl": true,
    "urgency": "medical",
    "crisis_level": "normal",
    "cylinders_requested": 2,
    "stock_at_distributor": 45,
    "queue_position": 3,
    "location_changes_30d": 0,
    "booking_gap_days": 30
  },
  "predictedScore": 85.2,
  "priorityBand": "high",
  "source": "ml-service"
}
```

**Response:**
```json
{
  "id": "pred-123",
  "bookingId": "booking-123",
  "inputFeatures": "{...json stringified...}",
  "predictedScore": 85.2,
  "priorityBand": "high",
  "source": "ml-service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Use Cases:**
- Recording ML predictions for audit trail
- Tracking fallback heuristic predictions
- Analytics on prediction accuracy

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success (GET/PATCH)
- `201` - Created (POST)
- `400` - Bad request (missing/invalid parameters)
- `404` - Not found (resource doesn't exist)
- `500` - Server error (database operation failed)

Error response format:
```json
{
  "error": "Human-readable error message"
}
```

---

## Integration with ML API

The `/api/ml/priority` endpoint should be updated to:
1. Accept `householdId` + `distributorId`
2. Fetch household from `/api/db/households/[id]`
3. Fetch distributor data from `/api/db/distributors/[id]`
4. Compute ML features from database records
5. Call FastAPI ML service
6. Return prediction, which gets stored via `/api/db/bookings/[id]` PATCH
7. Log prediction via `/api/db/predictions` POST

---

## Usage Example: Creating a Booking with ML Prediction

```typescript
// 1. Create booking
const booking = await fetch("/api/db/bookings", {
  method: "POST",
  body: JSON.stringify({
    householdId: "hh-123",
    distributorId: "dist-456",
    urgency: "medical",
    cylindersRequested: 2,
    priorityScore: 0, // Placeholder
    priorityBand: "low",
    mlSource: "pending",
  }),
});

// 2. Get ML prediction
const prediction = await fetch("/api/ml/priority", {
  method: "POST",
  body: JSON.stringify({
    householdId: "hh-123",
    distributorId: "dist-456",
  }),
});

// 3. Update booking with prediction
await fetch(`/api/db/bookings/${booking.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    priorityScore: prediction.score,
    priorityBand: prediction.band,
    mlSource: "ml-service",
  }),
});

// 4. Log prediction for audit trail
await fetch("/api/db/predictions", {
  method: "POST",
  body: JSON.stringify({
    bookingId: booking.id,
    inputFeatures: prediction.features,
    predictedScore: prediction.score,
    priorityBand: prediction.band,
    source: "ml-service",
  }),
});
```

This flow ensures data consistency and provides complete audit trail of decisions.
