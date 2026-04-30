# Architecture Overview — Paper Prints

See the full detailed architecture document in the previous session artifact.  
The living version is maintained here.

## System Design

```
User App (React Native) ─┐
Vendor App (React Native)─┤── REST API (Node.js/Express) ── PostgreSQL
Vendor Web (Next.js) ────┘       │                         ── Redis
                                 ├── Socket.IO (real-time)
                                 ├── AWS S3 (file storage)
                                 └── Python PDF Microservice (color detection)
```

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Mobile framework | React Native (Expo) | Cross-platform, shared patterns |
| State management | Zustand | Lightweight, no boilerplate |
| Auth | JWT + Refresh Tokens | Stateless, works for all 3 clients |
| File storage | AWS S3 | Never store files on server disk |
| Real-time | Socket.IO | Order status push to user/vendor |
| DB | PostgreSQL + PostGIS | Location queries for "shops near me" |

## Monorepo Layout

```
paper-prints/
├── backend/        ← Person 1 (Node.js + Express)
├── pdf-service/    ← Person 1 (Python, called by backend)
├── user-app/       ← Person 2 (React Native / Expo)
├── vendor-app/     ← Person 3 (React Native / Expo)
├── vendor-web/     ← Person 3 (Next.js)
├── shared/         ← All (constants + types)
└── docs/           ← All
```

## Branch Strategy

- `main` — production-ready only
- `dev` — integration branch, all PRs target here
- `feat/backend-*` — Person 1
- `feat/user-*` — Person 2
- `feat/vendor-*` — Person 3

> **Rule:** Never push directly to `main` or `dev`. Always open a PR.
