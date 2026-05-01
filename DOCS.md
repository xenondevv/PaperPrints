# 📄 Paper Prints — Technical Documentation

> **For teammates:** Everything you need to understand the system, connect to the backend, and call the APIs.

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [ER Diagram](#3-er-diagram)
4. [Backend Setup](#4-backend-setup)
5. [Authentication Flow](#5-authentication-flow)
6. [API Reference](#6-api-reference)
7. [WebSocket Events](#7-websocket-events)
8. [File Upload Pipeline](#8-file-upload-pipeline)
9. [Order Lifecycle](#9-order-lifecycle)
10. [Error Handling](#10-error-handling)

---

## 1. System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User App        │     │  Vendor App      │     │  Vendor Website  │
│  (Flutter)       │     │  (Flutter)       │     │  (Web)           │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                        │
         └───────────────────────┼────────────────────────┘
                                 │  HTTPS + WSS
                    ┌────────────▼────────────┐
                    │     Backend API          │
                    │   Node.js / Express      │
                    │   Port 3000              │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
    ┌─────────▼──────┐  ┌───────▼───────┐  ┌──────▼──────┐
    │  PostgreSQL     │  │  Redis        │  │  S3 / Local  │
    │  (primary DB)   │  │  (optional)   │  │  (file store)│
    └─────────────────┘  └───────────────┘  └─────────────┘
              │
    ┌─────────▼──────┐
    │  Firebase Admin │
    │  (auth verify)  │
    └─────────────────┘
```

### Key Technology Choices

| Component | Technology | Reason |
|---|---|---|
| Backend | Node.js + Express | Fast, JSON-native, easy WebSocket |
| Database | PostgreSQL | ACID, UUID support, spatial queries |
| Auth | Firebase (Google Sign-In) + JWT | No password storage, Google ecosystem |
| File Storage | AWS S3 (local disk fallback) | Scalable; local fallback for dev |
| Real-time | Socket.IO | Order status push to user/vendor |
| Mobile | Flutter (Riverpod + go_router) | Cross-platform iOS/Android |

---

## 2. Database Schema

### `users`
Stores all authenticated users (customers, vendors, admins).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `name` | TEXT | Display name from Google |
| `email` | TEXT UNIQUE | Google email |
| `phone` | TEXT UNIQUE | Optional |
| `password_hash` | TEXT | NULL for Google-only users |
| `firebase_uid` | TEXT UNIQUE | Links to Firebase account |
| `photo_url` | TEXT | Google profile picture |
| `role` | TEXT | `user` \| `vendor` \| `admin` |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### `vendors`
A print shop registered on the platform.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | Vendor owner's user account |
| `shop_name` | TEXT | Display name of the shop |
| `owner_name` | TEXT | Full name of owner |
| `phone` | TEXT | Contact number |
| `email` | TEXT | Contact email |
| `address` | TEXT | Human-readable address |
| `location_lat` | DOUBLE | GPS latitude |
| `location_lng` | DOUBLE | GPS longitude |
| `is_active` | BOOLEAN | Shop accepting orders? |
| `is_verified` | BOOLEAN | Admin verified? |

---

### `vendor_settings`
Pricing and capability config per vendor (1:1 with vendors).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `vendor_id` | UUID FK → vendors UNIQUE | |
| `price_bw` | NUMERIC(8,2) | Price per B&W page (₹) |
| `price_color` | NUMERIC(8,2) | Price per color page (₹) |
| `price_double_sided` | NUMERIC(8,2) | Extra per page for duplex |
| `opening_time` | TIME | e.g. `09:00` |
| `closing_time` | TIME | e.g. `21:00` |
| `max_file_size_mb` | INT | Max upload size |
| `avg_processing_min` | INT | Estimated processing time |
| `capabilities` | TEXT[] | e.g. `{color, binding, lamination}` |

---

### `files`
Uploaded documents (PDF, images, Office docs, etc.).

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → users | Who uploaded it |
| `file_url` | TEXT | S3 presigned URL or local URL |
| `s3_key` | TEXT | `uploads/{userId}/{fileId}.ext` |
| `file_name` | TEXT | Original filename |
| `file_size_bytes` | BIGINT | |
| `total_pages` | INT | Set by pdf-service (0 for non-PDF) |
| `uploaded_at` | TIMESTAMPTZ | |

---

### `file_pages`
Per-page color detection from the PDF analysis service.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `file_id` | UUID FK → files | |
| `page_number` | INT | 1-indexed |
| `is_color` | BOOLEAN | True if the page has color content |

---

### `orders`
A print job placed by a user at a vendor.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_number` | TEXT UNIQUE | e.g. `PP-20260501-64DF` |
| `user_id` | UUID FK → users | Customer |
| `vendor_id` | UUID FK → vendors | Print shop |
| `file_id` | UUID FK → files | Primary file |
| `status` | ENUM | See Order Lifecycle section |
| `copies` | INT | Number of copies |
| `is_double_sided` | BOOLEAN | Duplex printing |
| `total_price` | NUMERIC(10,2) | Computed at creation |
| `estimated_time` | INT | Minutes (set by vendor on accept) |
| `qr_code_url` | TEXT | Pickup QR (set when READY) |

**Status ENUM:** `PENDING` → `ACCEPTED` → `PROCESSING` → `READY` → `COMPLETED` | `REJECTED` | `CANCELLED`

---

### `order_pages`
User's per-page print type selection.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID FK → orders | |
| `page_number` | INT | 1-indexed |
| `print_type` | TEXT | `BW` or `COLOR` |

---

### `payments` *(stub — for future Cashfree integration)*

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `order_id` | UUID FK → orders UNIQUE | |
| `amount` | NUMERIC(10,2) | |
| `status` | ENUM | `PENDING` \| `COMPLETED` \| `FAILED` \| `REFUNDED` |
| `payment_method` | TEXT | `UPI` \| `CASH` \| `CARD` |
| `transaction_id` | TEXT | From payment gateway |

---

## 3. ER Diagram

```
users ──────────────────────────────────────────────────────────────
  │ 1                                                                │
  │ N                                                                │
vendors ───────────────────────────────────────────────────────     │
  │ 1                                                           │    │
  │ 1                                                           │    │
vendor_settings                                                 │    │
                                                                │    │
users ──────1──────────────────────N────────────────── files   │    │
                                                         │      │    │
                                                         │ 1    │    │
                                                         │ N    │    │
                                                       file_pages    │
                                                                      │
users ──N──────────────┐                                              │
                       │                                              │
vendors ──N────────────┴──── orders (user_id, vendor_id, file_id) ──┘
                               │ 1
                               │ N
                             order_pages
                               │ 1
                               │ 0..1
                             payments
```

---

## 4. Backend Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14
- (Optional) Redis, AWS S3, Firebase project

### Install

```bash
git clone https://github.com/xenondevv/PaperPrints.git
cd PaperPrints/backend
npm install
```

### Environment Variables (`.env`)

```env
# Server
PORT=3000
NODE_ENV=development

# PostgreSQL (required)
DATABASE_URL=postgresql://user:password@localhost:5432/paper_prints

# JWT (required)
JWT_SECRET=your-super-secret-32-chars-minimum
JWT_REFRESH_SECRET=another-secret-for-refresh-tokens
JWT_EXPIRES_IN=7d

# Firebase Admin SDK (required for Google login)
# Option A: JSON string
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
# Option B: Path to downloaded JSON file
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# AWS S3 (optional — falls back to ./uploads/ folder if not set)
AWS_REGION=ap-south-1
S3_BUCKET=paper-prints-files

# PDF Analysis Service (optional — pages = [] if not running)
PDF_SERVICE_URL=http://localhost:5001

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

### Database Setup

```bash
createdb paper_prints
psql paper_prints < src/migrations/001_initial_schema.sql
psql paper_prints < src/migrations/004_firebase_auth.sql
```

### Seed a Demo Vendor

```sql
-- Run in psql
WITH u AS (
  INSERT INTO users (name, email, role)
  VALUES ('QuickPrint Owner', 'qp@example.com', 'vendor')
  RETURNING id
),
v AS (
  INSERT INTO vendors (user_id, shop_name, owner_name, address,
    location_lat, location_lng, is_active, is_verified)
  SELECT id, 'QuickPrint', 'QP Owner', 'Sector 18, Noida',
    28.6324, 77.4437, TRUE, TRUE
  FROM u RETURNING id
)
INSERT INTO vendor_settings (vendor_id, price_bw, price_color)
SELECT id, 2.00, 10.00 FROM v;
```

### Run

```bash
npm run dev     # development (nodemon)
npm start       # production
```

---

## 5. Authentication Flow

```
App                    Backend              Firebase
 │                        │                    │
 │── Google Sign-In ──────│                    │
 │◄── idToken ────────────│                    │
 │                        │                    │
 │  POST /auth/firebase   │                    │
 │  { idToken }          │                    │
 │───────────────────────►│                    │
 │                        │─ verifyIdToken() ─►│
 │                        │◄─ { uid, email } ──│
 │                        │                    │
 │                        │ UPSERT users       │
 │                        │                    │
 │◄── { accessToken,     │                    │
 │      refreshToken,    │                    │
 │      user }           │                    │
```

All subsequent requests: `Authorization: Bearer <accessToken>`

Refresh: `POST /auth/refresh` → `{ refreshToken }`

---

## 6. API Reference

### Base URL
```
http://<server-ip>:3000/api
```

All endpoints except `/auth/*` require:
```
Authorization: Bearer <accessToken>
```

---

### Auth

#### `POST /auth/firebase`
```json
// Request
{ "idToken": "<Firebase ID token>" }

// Response 200
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": "uuid", "name": "...", "email": "...", "role": "user" }
}
```

#### `POST /auth/refresh`
```json
// Request
{ "refreshToken": "eyJ..." }

// Response 200
{ "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

---

### Users

#### `GET /users/me`
```json
// Response 200
{
  "user": {
    "id": "uuid", "name": "Devansh", "email": "d@x.com",
    "phone": null, "photoUrl": "https://...", "role": "user"
  }
}
```

#### `PATCH /users/me`
```json
// Request
{ "name": "New Name", "phone": "+911234567890" }

// Response 200
{ "user": { ... } }
```

---

### Files

#### `POST /files/upload`
```
Content-Type: multipart/form-data
Field name: "file"
Max size: 50 MB
Types: PDF, JPEG, PNG, GIF, WEBP, BMP, TIFF, DOCX, XLSX, PPTX, CSV, TXT
```
```json
// Response 201
{
  "file": {
    "id": "uuid",
    "fileName": "report.pdf",
    "fileUrl": "https://...",
    "totalPages": 12,
    "uploadedAt": "2026-05-01T18:00:00Z",
    "pages": [
      { "page_number": 1, "is_color": false },
      { "page_number": 2, "is_color": true }
    ]
  }
}
```

> `pages` is empty if PDF service is not running. `totalPages` = 0 for non-PDF files.

---

### Vendors

#### `GET /vendors/nearby?lat=28.6&lng=77.4&radius=10`
```json
// Response 200
{
  "vendors": [{
    "id": "uuid",
    "shopName": "QuickPrint",
    "address": "Sector 18, Noida",
    "locationLat": 28.63,
    "locationLng": 77.44,
    "distanceKm": 1.2,
    "settings": {
      "priceBw": 2.00,
      "priceColor": 10.00,
      "priceDoubleSided": 0.50,
      "openingTime": "09:00",
      "closingTime": "21:00",
      "avgProcessingMin": 15
    }
  }]
}
```

#### `GET /vendors/:id`
```json
// Response 200
{ "vendor": { ... } }
```

---

### Orders

#### `POST /orders`
```json
// Request
{
  "vendor_id": "uuid",
  "file_id": "uuid",
  "copies": 2,
  "is_double_sided": false,
  "orientation": "PORTRAIT",
  "pages": [
    { "page_number": 1, "print_type": "BW" },
    { "page_number": 2, "print_type": "COLOR" }
  ]
}
// pages = [] or omit → print all pages
```
```json
// Response 201
{
  "order": {
    "id": "uuid",
    "orderNumber": "PP-20260501-64DF",
    "status": "PENDING",
    "copies": 2,
    "isDoubleSided": false,
    "totalPrice": 48.00,
    "estimatedTime": null,
    "qrCodeUrl": null,
    "createdAt": "2026-05-01T18:00:00Z",
    "pages": []
  }
}
```

#### `GET /orders`
```json
// Response 200
{ "orders": [ { ...order }, ... ] }
```

#### `GET /orders/:id`
```json
// Response 200
{ "order": { ...full order with pages... } }
```

#### `PATCH /orders/:id/status` *(cancel only)*
```json
// Request
{ "status": "CANCELLED" }

// Response 200
{ "message": "Order cancelled" }
```

---

### HTTP Error Format

```json
{ "message": "Human-readable error description" }
```

| Code | Meaning |
|---|---|
| 400 | Validation failure / bad request |
| 401 | Missing or expired JWT |
| 403 | Wrong role |
| 404 | Not found |
| 413 | File too large |
| 500 | Server error |

---

## 7. WebSocket Events

```javascript
// Connect
const socket = io('http://<server-ip>:3000', {
  auth: { token: '<accessToken>' }
});

// Subscribe to an order
socket.emit('JOIN_ORDER', { orderId: 'uuid' });

// Listen for updates
socket.on('ORDER_ACCEPTED',   ({ orderId, estimatedTime }) => { ... });
socket.on('ORDER_REJECTED',   ({ orderId }) => { ... });
socket.on('ORDER_PROCESSING', ({ orderId }) => { ... });
socket.on('ORDER_READY',      ({ orderId, qrCodeUrl }) => { ... });
socket.on('ORDER_COMPLETED',  ({ orderId }) => { ... });

// Unsubscribe
socket.emit('LEAVE_ORDER', { orderId: 'uuid' });
```

---

## 8. File Upload Pipeline

```
Flutter ──POST /files/upload──► multer (50MB cap)
                                      │
                             S3 configured?
                            YES │          │ NO
                                ▼          ▼
                             S3 bucket   ./uploads/
                                      │
                             pdf-service running?
                            YES │          │ NO
                                ▼          ▼
                         analyse pages   pages = []
                                      │
                           INSERT files
                           INSERT file_pages
                                      │
                           Response: { file }
```

Local dev URL: `http://<server-ip>:3000/uploads/<filename>`

---

## 9. Order Lifecycle

```
User places order
        │
        ▼
    PENDING ──── User cancels ──────────────► CANCELLED
        │
Vendor action:
   accept │          │ reject
          ▼          ▼
      ACCEPTED    REJECTED
          │
   Vendor starts printing
          │
          ▼
     PROCESSING
          │
   Print job done
          │
          ▼
       READY  ◄── qrCodeUrl set here
          │
   User picks up (vendor marks done)
          │
          ▼
     COMPLETED
```

**Price formula:**
```
total = (bw_pages × price_bw + color_pages × price_color) × copies
      + (total_pages × copies × price_double_sided)  [only if double-sided]
```

---

## 10. Quick Reference Card

```
BASE URL:   http://<ip>:3000/api
AUTH:       Authorization: Bearer <accessToken>

POST  /auth/firebase           Login with Google idToken
POST  /auth/refresh            Rotate tokens

GET   /users/me                Get profile
PATCH /users/me                Update profile

POST  /files/upload            Upload file (multipart, field="file")

GET   /vendors/nearby          ?lat=&lng=&radius=
GET   /vendors/:id             Vendor detail

POST  /orders                  Place order
GET   /orders                  List my orders
GET   /orders/:id              Single order
PATCH /orders/:id/status       Cancel order

WEBSOCKET: ws://<ip>:3000
  auth.token = <accessToken>
  emit  → JOIN_ORDER  { orderId }
  listen← ORDER_ACCEPTED | ORDER_READY | ORDER_REJECTED | ORDER_PROCESSING | ORDER_COMPLETED
```

---

*Last updated: May 2026 — Phase 1 complete (`phase1-app-done`)*
