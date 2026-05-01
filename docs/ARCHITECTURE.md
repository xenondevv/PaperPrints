# Architecture — Paper Prints Platform

> Living document. Last updated: May 2026.  
> Covers: system design, user-app Flutter migration, data flow, and directory structure.

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PAPER PRINTS PLATFORM                        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  User App    │  │  Vendor App  │  │      Vendor Web          │  │
│  │  (Flutter)   │  │  (React      │  │      (Next.js)           │  │
│  │              │  │   Native)    │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                 │                        │                │
│         └─────────────────┼────────────────────────┘                │
│                           │  HTTPS REST + WebSocket                 │
│                    ┌──────▼───────────────────┐                     │
│                    │   Node.js / Express API   │                     │
│                    │   (Port 3000)             │                     │
│                    │                           │                     │
│                    │  ┌──────┐  ┌──────────┐  │                     │
│                    │  │ REST │  │ Socket.IO│  │                     │
│                    │  └──────┘  └──────────┘  │                     │
│                    └──┬──────────────┬─────────┘                     │
│                       │              │                               │
│               ┌───────▼───┐  ┌──────▼──────┐                        │
│               │ PostgreSQL │  │    Redis    │                        │
│               │ + PostGIS  │  │  (cache /   │                        │
│               │            │  │   queues)   │                        │
│               └───────────┘  └─────────────┘                        │
│                       │                                             │
│               ┌───────▼───────┐  ┌─────────────────┐               │
│               │    AWS S3     │  │  PDF Microservice│               │
│               │ (file storage)│  │  (Python/Flask)  │               │
│               └───────────────┘  │  Color detection │               │
│                                  └─────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Technology Decisions

| Layer | Decision | Rationale |
|---|---|---|
| **User App** | Flutter 3.29 (Dart) | Native performance, single codebase for Android + iOS |
| **Vendor App** | React Native (Expo) | Retained; team familiar, same API surface |
| **Vendor Web** | Next.js | SSR for SEO, dashboard-style UX |
| **State (Flutter)** | Riverpod | Compile-safe, testable, replaces Zustand from RN version |
| **Navigation (Flutter)** | GoRouter | URL-based, deep-link friendly, auth redirect guard |
| **HTTP (Flutter)** | Dio | Interceptor chain for JWT auto-refresh |
| **Auth** | JWT + Refresh Tokens | Stateless, works across all 3 clients |
| **Real-time** | Socket.IO | Order status push (vendor → user, vendor → vendor-web) |
| **File storage** | AWS S3 (pre-signed URLs) | Never store files on server disk |
| **DB** | PostgreSQL + PostGIS | Geo queries for "shops near me" (`ST_Distance`) |
| **Cache** | Redis | Token blocklist, session data, pub/sub for sockets |
| **PDF analysis** | Python / Flask microservice | Color-page detection, page count |

---

## 3. Monorepo Layout

```
paper-prints/
├── backend/                ← Node.js + Express API
│   └── src/
│       ├── app.js          ← Express factory
│       ├── server.js       ← HTTP server + Socket.IO bootstrap
│       ├── config/         ← db, redis, s3, env, jwt
│       ├── middleware/      ← auth, error handler, rate limiter
│       ├── modules/         ← feature modules (auth, orders, vendors…)
│       │   ├── auth/
│       │   ├── users/
│       │   ├── vendors/
│       │   ├── files/
│       │   ├── orders/
│       │   └── payments/
│       ├── services/        ← s3Service, pdfService, emailService
│       ├── sockets/         ← Socket.IO room management
│       ├── migrations/      ← SQL schema migrations
│       ├── seeds/           ← Dev seed data
│       └── utils/
│
├── pdf-service/            ← Python/Flask — color detection
│
├── user-app/               ← Flutter (NEW — migrated from React Native)
│   ├── lib/
│   │   ├── main.dart
│   │   ├── core/
│   │   │   ├── constants/  ← AppConstants, OrderStatus, PrintType
│   │   │   ├── network/    ← ApiClient (Dio), Repositories
│   │   │   ├── router/     ← GoRouter (auth guard, shell route)
│   │   │   ├── theme/      ← AppTheme, AppColors
│   │   │   └── utils/
│   │   ├── features/
│   │   │   ├── auth/       ← LoginScreen, RegisterScreen, AuthProvider
│   │   │   ├── home/       ← HomeScreen
│   │   │   ├── shops/      ← ShopListScreen, ShopDetailScreen, ShopsProvider
│   │   │   ├── upload/     ← UploadScreen (3-step flow)
│   │   │   ├── orders/     ← OrderHistoryScreen, OrderDetailScreen, OrdersProvider
│   │   │   └── profile/    ← ProfileScreen
│   │   └── shared/
│   │       └── widgets/    ← ShopCard, MainShell (bottom nav)
│   ├── pubspec.yaml
│   └── android/ ios/ web/
│
├── vendor-app/             ← React Native (Expo) — unchanged
├── vendor-web/             ← Next.js — unchanged
├── shared/                 ← types.js, constants shared across JS clients
├── docs/                   ← ARCHITECTURE.md (this file)
└── docker-compose.yml      ← postgres, redis, backend, pdf-service
```

---

## 4. User App — Flutter Architecture

The app follows a **feature-first** folder structure with **Riverpod** for state and **GoRouter** for navigation.

### 4.1 Layer Diagram

```
┌─────────────────────────────────────────────────────┐
│                    UI Layer                          │
│  Screens (ConsumerWidget / ConsumerStatefulWidget)   │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────────┐  │
│  │  Auth  │ │ Shops  │ │Upload  │ │   Orders     │  │
│  └────────┘ └────────┘ └────────┘ └──────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ ref.watch / ref.read
┌──────────────────────▼──────────────────────────────┐
│                  State Layer (Riverpod)              │
│  authProvider     → AuthNotifier (StateNotifier)     │
│  nearbyShopsProvider → NearbyShopsNotifier           │
│  ordersProvider   → OrdersNotifier                   │
│  shopDetailProvider  → FutureProvider.family         │
│  routerProvider   → GoRouter (reads authProvider)    │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 Data Layer                          │
│  AuthRepository   → POST /auth/login, /register     │
│  VendorsRepository → GET /vendors/nearby, /:id      │
│  FilesRepository  → POST /files/upload              │
│  OrdersRepository → GET/POST/PATCH /orders          │
│  UsersRepository  → GET/PATCH /users/me             │
└──────────────────────┬──────────────────────────────┘
                       │ Dio + JWT interceptor
┌──────────────────────▼──────────────────────────────┐
│              Network Layer (ApiClient)               │
│  • Singleton Dio instance                            │
│  • _AuthInterceptor — attaches Bearer token          │
│  • Auto-refresh on 401 (POST /auth/refresh)          │
│  • Clears SecureStorage on refresh failure           │
└─────────────────────────────────────────────────────┘
```

### 4.2 Navigation Flow

```
App start
   │
   ├─ No token in SecureStorage → /login
   │     └─ Success → GoRouter redirect → /home
   │
   └─ Token present (auto-login) → /home
         │
         ├─ /home        HomeScreen     (tab 0)
         ├─ /shops       ShopListScreen (tab 1)
         │    └─ /shops/:id  ShopDetailScreen
         │         └─ "Print Here" → /upload?vendorId=…
         ├─ /upload      UploadScreen   (tab 2)
         │    └─ Place order → /orders/:id
         ├─ /orders      OrderHistoryScreen (tab 3)
         │    └─ /orders/:id  OrderDetailScreen (real-time)
         └─ /profile     ProfileScreen  (tab 4)
```

### 4.3 Auth Flow

```
User submits login
        │
        ▼
  AuthNotifier.login()
        │
        ▼
  AuthRepository.login() → POST /auth/login
        │
  ┌─────▼─────────────────────────────────────┐
  │  Response: { user, accessToken,           │
  │              refreshToken }               │
  └─────┬─────────────────────────────────────┘
        │
        ▼
  FlutterSecureStorage.write(accessToken, refreshToken, user)
        │
        ▼
  AuthState(user: UserModel, isLoggedIn: true)
        │
        ▼
  routerProvider re-evaluates → redirects to /home
```

### 4.4 Order Lifecycle (Real-time)

```
User (Flutter app)                 Backend              Vendor App
       │                              │                      │
       │── POST /orders ─────────────►│                      │
       │◄── { order: {id, PENDING} }──│                      │
       │                              │──socket: new_order──►│
       │                              │                      │── Accept/Reject
       │                              │◄─────────────────────│
       │◄──socket: order_accepted ────│                      │
       │  (updates OrdersNotifier)    │                      │
       │                              │  [print job runs]    │
       │◄──socket: status_update ─────│                      │
       │  (PROCESSING)                │                      │
       │◄──socket: order_ready ───────│                      │
       │  (qr_code_url attached)      │                      │
       │  → QRDisplay shown           │                      │
       │                              │                      │
       │── User shows QR at counter   │                      │
       │                              │──socket: completed──►│
```

---

## 5. Backend Module Structure

Each module follows the pattern: `router → controller → service → db`

```
modules/auth/
├── auth.routes.js       ← Express router
├── auth.controller.js   ← Request/response handling
├── auth.service.js      ← Business logic (bcrypt, jwt, db)
└── auth.schema.js       ← Joi validation schemas

modules/orders/
├── orders.routes.js
├── orders.controller.js
├── orders.service.js    ← price calc, status transitions
└── orders.schema.js
```

### API Endpoints Summary

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register user or vendor |
| `POST` | `/auth/login` | ❌ | Login, returns JWT pair |
| `POST` | `/auth/refresh` | ❌ | Rotate access token |
| `GET` | `/vendors/nearby` | ✅ | PostGIS radius search |
| `GET` | `/vendors/:id` | ✅ | Shop detail + pricing |
| `POST` | `/files/upload` | ✅ | Upload PDF → S3, analyze |
| `POST` | `/orders` | ✅ | Create order |
| `GET` | `/orders` | ✅ | User's order history |
| `GET` | `/orders/:id` | ✅ | Order detail + pages |
| `PATCH` | `/orders/:id/status` | ✅ | Status transition |
| `GET` | `/orders/:id/qr` | ✅ | Pickup QR code |
| `GET` | `/users/me` | ✅ | Profile |
| `PATCH` | `/users/me` | ✅ | Update name/email |

---

## 6. Data Model (Key Tables)

```sql
users          id, name, phone, email, password_hash, role, lat, lng
vendors        id, user_id, shop_name, address, lat, lng, is_open
vendor_settings  vendor_id, price_bw, price_color, price_double_sided, capabilities[]
files          id, user_id, s3_key, filename, total_pages, size_bytes
file_pages     id, file_id, page_number, is_color
orders         id, user_id, vendor_id, file_id, status, copies,
               is_double_sided, total_price, order_number
order_pages    id, order_id, page_number, print_type
```

---

## 7. What Changed — Migration Summary

### Before (React Native / Expo)
- User app: React Native + Expo SDK 51
- State: Zustand
- Navigation: React Navigation (stack + bottom tabs)
- HTTP: Axios with interceptors
- Components: `.jsx` files in `src/components/`

### After (Flutter)
- User app: **Flutter 3.29.3 + Dart 3.7**
- State: **Riverpod** (`StateNotifier`, `FutureProvider.family`)
- Navigation: **GoRouter** (URL-based, auth redirect, ShellRoute for tabs)
- HTTP: **Dio** with `_AuthInterceptor` (JWT + auto-refresh)
- Storage: **FlutterSecureStorage** (replaces AsyncStorage)
- File pick: **file_picker** package (replaces `expo-document-picker`)
- Location: **geolocator** (replaces `expo-location`)
- Share: **share_plus** (replaces React Native `Share`)

### Feature Parity Checklist

| Feature | RN | Flutter |
|---|---|---|
| Login / Register | ✅ | ✅ |
| Auto-login (persisted token) | ✅ | ✅ |
| JWT refresh on 401 | ✅ | ✅ |
| Nearby shops (GPS) | ✅ | ✅ |
| Shop search / filter | ✅ | ✅ |
| Shop detail screen | ✅ | ✅ |
| Call / Directions links | ✅ | ✅ |
| PDF upload (+ progress) | ✅ | ✅ |
| Per-page B&W / Color toggle | ✅ | ✅ |
| Copies stepper | ✅ | ✅ |
| Double-sided switch | ✅ | ✅ |
| Estimated price | ✅ | ✅ |
| Place order | ✅ | ✅ |
| Real-time order tracking | ✅ | ✅ (socket_io_client) |
| Status tracker stepper | ✅ | ✅ |
| QR pickup card | ✅ | ✅ |
| Order cancel | ✅ | ✅ |
| Order history | ✅ | ✅ |
| Profile + edit name/email | ✅ | ✅ |

---

## 8. Branch Strategy

```
main  ←──── PRs only (after QA)
  │
dev   ←──── integration branch
  ├── feat/backend-*    (Person 1)
  ├── feat/user-*       (Person 2 — Flutter)
  └── feat/vendor-*     (Person 3)
```

> **Rule:** Never push directly to `main` or `dev`. Always open a PR with a review.

---

## 9. Local Development

```bash
# Start all services
docker-compose up -d          # postgres + redis + pdf-service

# Backend
cd backend && npm run dev

# User app (Flutter) — physical device or emulator
cd user-app
flutter pub get
flutter run -d ZA222MJYB4     # moto g85 (connected device)

# Vendor app (React Native)
cd vendor-app && npx expo start

# Vendor web
cd vendor-web && npm run dev
```

> **Android emulator note:** Use `10.0.2.2` as the host to reach `localhost` on your machine. The Flutter app defaults to this via `AppConstants.apiBaseUrl`.
